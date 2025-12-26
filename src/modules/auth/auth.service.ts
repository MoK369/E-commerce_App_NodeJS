import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ConfirmEmailBodyDto,
  ForgetPasswordDto,
  GmailAuthDto,
  LoginBodyDto,
  ResendConfirmEmailBodyDto,
  ResetForgetPasswordDto,
  SignUpBodyDto,
  VerifyForgetPasswordDto,
} from './dto/auth.dto';
import { HydratedUser, UserRepository } from 'src/db';
import {
  EmailEventsEnum,
  HashingUtil,
  IdService,
  IOtp,
  ProvidersEnum,
} from 'src/common';
import OtpRepository from 'src/db/repositories/otp.repository';
import { Types } from 'mongoose';
import TokenService from 'src/common/services/security/token.security';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { IProfileImage } from 'src/common/interfaces/user.interface';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly _userRepository: UserRepository,
    private readonly _otpRepository: OtpRepository,
    private readonly _idService: IdService,
    private readonly _tokenService: TokenService,
  ) {}

  private async _createNewOtp({
    userId,
    type = EmailEventsEnum.confirmEmail,
    count = 0,
  }: {
    userId: Types.ObjectId;
    type?: EmailEventsEnum;
    count?: number;
  }): Promise<void> {
    await this._otpRepository.create({
      data: [
        {
          code: this._idService.generateNumericId(),
          expiresAt: new Date(
            Date.now() + Number(process.env.OTP_EXPIRATION_TIME_IN_S) * 1000,
          ),
          createdBy: userId,
          count,
          type,
        },
      ],
    });
  }

  async signUp(data: SignUpBodyDto): Promise<void> {
    const { username, email, password } = data;

    const emailExists = await this._userRepository.findOne({
      filter: { email },
    });

    if (emailExists) {
      throw new ConflictException('Email already exists ⚠️');
    }

    const [user] = await this._userRepository.create({
      data: [{ username, email, password }],
    });

    if (!user) {
      throw new BadRequestException('Failed to create account 🚫');
    }

    await this._createNewOtp({ userId: user._id });
  }

  async resendConfirmEmail(data: ResendConfirmEmailBodyDto): Promise<void> {
    const { email } = data;

    const user = await this._userRepository.findOne({
      filter: { email, confirmedAt: { $exists: false } },
      options: {
        populate: [
          { path: 'otps', match: { type: EmailEventsEnum.confirmEmail } },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid email or already verified ❌');
    }

    if (user.otps?.length) {
      throw new BadRequestException(
        `Can't send a new OTP until the old one expires ⏳, time ${user.otps[0].expiresAt}`,
      );
    }

    await this._createNewOtp({ userId: user._id });
  }

  async confirmEmail(data: ConfirmEmailBodyDto): Promise<void> {
    const { email, otp } = data;

    const user = await this._userRepository.findOne({
      filter: { email, confirmedAt: { $exists: false } },
      options: {
        populate: [
          { path: 'otps', match: { type: EmailEventsEnum.confirmEmail } },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid email or already verified ❌');
    }

    if (
      !(
        user.otps?.length &&
        (await HashingUtil.compareHash({
          plainText: otp,
          cipherText: user.otps[0].code,
        }))
      )
    ) {
      throw new BadRequestException(`Invalid OTP ❌ or has expired ⏰`);
    }

    await Promise.all([
      user.updateOne({ confirmedAt: new Date() }),
      this._otpRepository.deleteOne({ filter: { _id: user.otps[0]._id } }),
    ]);
  }

  async logIn(data: LoginBodyDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: HydratedUser;
  }> {
    const { email, password } = data;

    const user = await this._userRepository.findOne({
      filter: {
        email,
        confirmedAt: { $exists: true },
        provider: ProvidersEnum.local,
      },
    });

    if (
      !user ||
      !(await HashingUtil.compareHash({
        plainText: password,
        cipherText: user.password,
      }))
    ) {
      throw new NotFoundException('Invalid login Credentials ⚠️');
    }

    return {
      ...(await this._tokenService.getTokensBasedOnRole({ user })),
      user,
    };
  }

  private _verifyGmailAccount = async ({
    idToken,
  }: {
    idToken: string;
  }): Promise<TokenPayload> => {
    try {
      const client = new OAuth2Client({});
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_IDS?.split(',') || [], // Specify the WEB_CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
      });
      const payload = ticket.getPayload();
      // This ID is unique to each Google Account, making it suitable for use as a primary key
      // during account lookup. Email is not a good choice because it can be changed by the user.

      if (!payload?.email_verified) {
        throw new BadRequestException(
          'Failed to verify this gmail account 🇬✉️',
        );
      }
      return payload;
    } catch (error) {
      throw new BadRequestException(
        `Failed Verifying idToken, Error: ${error.message} `,
      );
    }
  };

  async signUpWithGmail(body: GmailAuthDto): Promise<{
    statusCode: number;
    accessToken: string;
    refreshToken: string;
    user: HydratedUser;
  }> {
    const { idToken } = body;

    const { email, given_name, family_name, picture } =
      await this._verifyGmailAccount({ idToken });

    if (!email || !given_name || given_name.length < 2) {
      throw new BadRequestException('Invaild gmail account credentials 🇬🪪');
    }

    const userExist = await this._userRepository.findOne({
      filter: { email },
    });

    if (userExist) {
      if (userExist.provider === ProvidersEnum.google) {
        return await this.logInWithGmail(body);
      }
      throw new ConflictException('Email exists with another provider ✉️❌');
    }

    const objectToCreate: {
      profileImage?: IProfileImage;
    } = {};
    if (picture && picture.length != 0) {
      objectToCreate.profileImage = {
        url: picture,
        provider: ProvidersEnum.google,
      };
    }

    const [user] = await this._userRepository.create({
      data: [
        {
          firstName: given_name,
          lastName:
            family_name || `${this._idService.generateNumericId({ size: 3 })}`,
          email,
          confirmedAt: new Date(),
          provider: ProvidersEnum.google,
          ...objectToCreate,
        },
      ],
    });

    if (!user) {
      throw new InternalServerErrorException('Failed to create user account');
    }

    const { accessToken, refreshToken } =
      await this._tokenService.getTokensBasedOnRole({
        user: user!,
      });

    return { statusCode: 201, accessToken, refreshToken, user };
  }

  logInWithGmail = async (
    body: GmailAuthDto,
  ): Promise<{
    statusCode: number;
    accessToken: string;
    refreshToken: string;
    user: HydratedUser;
  }> => {
    const { idToken } = body;

    const { email } = await this._verifyGmailAccount({ idToken });

    if (!email) {
      throw new BadRequestException('Invaild gmail account credentials 🇬🪪');
    }

    const user = await this._userRepository.findOne({
      filter: {
        email,
        authProvider: ProvidersEnum.google,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Invalid user account ⚠️ or Email exists with another provider ✉️❌',
      );
    }

    const { accessToken, refreshToken } =
      await this._tokenService.getTokensBasedOnRole({
        user,
      });

    return { statusCode: 200, accessToken, refreshToken, user };
  };

  async forgetPassword(body: ForgetPasswordDto): Promise<number> {
    const user = await this._userRepository.findOne({
      filter: { email: body.email },
      options: {
        populate: [
          { path: 'otps', match: { type: EmailEventsEnum.forgetPassword } },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid email address ❌');
    }

    if (
      user?.lastResetPasswordAt &&
      Date.now() <= user.lastResetPasswordAt.getTime() + 24 * 60 * 60 * 1000
    ) {
      throw new ForbiddenException(
        'You have reset your password recently, please try after 24 hours from last reset',
      );
    }

    const count = this.checkNewOtpCount(user?.otps[0]);
    let statusCode: number;
    // either create new otp obj or update existing one
    if (!user?.otps?.length) {
      await this._createNewOtp({
        userId: user._id,
        type: EmailEventsEnum.forgetPassword,
      });
      statusCode = 201;
    } else {
      await Promise.all([
        this._otpRepository.updateOne({
          filter: { _id: user.otps[0]._id },
          update: {
            code: this._idService.generateNumericId(),
            expiresAt: new Date(
              Date.now() + Number(process.env.OTP_EXPIRATION_TIME_IN_S) * 1000,
            ),
            count,
          },
        }),
        user.updateOne({
          $unset: {
            resetPasswordVerificationExpiresAt: 1,
          },
        }),
      ]);
      statusCode = 200;
    }
    return statusCode;
  }

  checkNewOtpCount(OtpDocument?: IOtp) {
    if (OtpDocument && OtpDocument.code) {
      console.log(
        Date.now() +
          Number(process.env.OTP_EXPIRATION_TIME_IN_S) * 1000 -
          OtpDocument.expiresAt.getTime() <=
          3 * 60 * 1000,
      );
      if (OtpDocument?.count! >= 5) {
        if (
          Date.now() +
            Number(process.env.OTP_EXPIRATION_TIME_IN_S) * 1000 -
            OtpDocument.expiresAt.getTime() >=
          10 * 60 * 1000
        ) {
          OtpDocument.count = 0;
        } else {
          throw new HttpException(
            'Too many requests, please try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      } else {
        if (
          Date.now() +
            Number(process.env.OTP_EXPIRATION_TIME_IN_S) * 1000 -
            OtpDocument.expiresAt.getTime() <=
          3 * 60 * 1000
        ) {
          OtpDocument.count!++;
        } else {
          OtpDocument.count = 0;
        }
      }
    }

    return OtpDocument?.count || 0;
  }

  async verifyForgetPassword(body: VerifyForgetPasswordDto) {
    const user = await this._userRepository.findOne({
      filter: { email: body.email },
      options: {
        populate: [
          { path: 'otps', match: { type: EmailEventsEnum.forgetPassword } },
        ],
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid Account!');
    }
    if (!user?.otps?.length) {
      throw new NotFoundException('Otp is not found or has expired');
    }

    const otp = user.otps[0];

    console.log({ otp });

    if (
      !(await HashingUtil.compareHash({
        plainText: body.otpCode,
        cipherText: otp.code,
      }))
    ) {
      throw new BadRequestException('Invalid otp ❌');
    }

    await this._userRepository.updateOne({
      filter: { _id: user._id! },
      update: {
        resetPasswordVerificationExpiresAt: Date.now() + 10 * 60 * 1000,
      },
    });

    await otp.deleteOne();
  }

  async resetForgetPassword(body: ResetForgetPasswordDto) {
    const user = await this._userRepository.findOne({
      filter: { email: body.email },
    });
    if (!user) {
      throw new NotFoundException('Invalid Acccount!');
    }
    if (!user.resetPasswordVerificationExpiresAt) {
      throw new BadRequestException('Please Verify Your OTP');
    }
    if (Date.now() >= user.resetPasswordVerificationExpiresAt.getTime()) {
      throw new BadRequestException('OTP Verificatin has Expired!');
    }

    await this._userRepository.updateOne({
      filter: { _id: user._id! },
      update: {
        password: await HashingUtil.generateHash({
          plainText: body.password,
        }),
        lastResetPasswordAt: Date.now(),
        changeCredentialsTime: Date.now(),
        $unset: {
          resetPasswordVerificationExpiresAt: true,
        },
      },
    });
  }
}
