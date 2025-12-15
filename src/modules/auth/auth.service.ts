import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConfirmEmailBodyDto,
  LoginBodyDto,
  ResendConfirmEmailBodyDto,
  SignUpBodyDto,
} from './dto/auth.dto';
import { HydratedUser, UserRepository } from 'src/db';
import {
  EmailEventsEnum,
  HashingUtil,
  IdService,
  ProvidersEnum,
} from 'src/common';
import OtpRepository from 'src/db/repositories/otp.repository';
import { Types } from 'mongoose';
import TokenService from 'src/common/utils/security/token.security';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly _userRepository: UserRepository,
    private readonly _otpRepository: OtpRepository,
    private readonly _idService: IdService,
    private readonly _tokenService: TokenService,
  ) {}

  private async _createNewOtp(userId: Types.ObjectId): Promise<void> {
    await this._otpRepository.create({
      data: [
        {
          code: this._idService.generateNumericId(),
          expiresAt: new Date(
            Date.now() + Number(process.env.OTP_EXPIRATION_TIME_IN_S) * 1000,
          ),
          createdBy: userId,
          type: EmailEventsEnum.confirmEmail,
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

    this._createNewOtp(user._id);
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

    await this._createNewOtp(user._id);
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

  async logIn(
    data: LoginBodyDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: HydratedUser }> {
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
}
