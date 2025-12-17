import {
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { HydratedUser, RevokedTokenRepository, UserRepository } from 'src/db';
import {
  SignatureLevelsEnum,
  UserRolesEnum,
  ITokenPayload,
  IdService,
  TokenTypesEnum,
  LogoutStatusEnum,
} from 'src/common';
import { Types } from 'mongoose';

@Injectable()
class TokenService {
  constructor(
    private readonly _idService: IdService,
    private readonly _jwtService: JwtService,
    private readonly _userRepository: UserRepository,
    private readonly _revokedTokenRepository: RevokedTokenRepository,
  ) {}

  generate = ({
    payload,
    options = {
      secret: process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    },
  }: {
    payload: ITokenPayload;
    options?: JwtSignOptions;
  }): Promise<string> => {
    return this._jwtService.signAsync(payload, options);
  };

  verifiy({
    token,
    options = {
      secret: process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
    },
  }: {
    token: string;
    options?: JwtVerifyOptions;
  }): Promise<ITokenPayload> {
    return (
      this._jwtService.verifyAsync(
        token,
        options,
      ) as unknown as Promise<ITokenPayload>
    ).catch((error) => {
      throw new BadRequestException(error);
    });
  }

  getSignatureLevel({ role }: { role: UserRolesEnum }): SignatureLevelsEnum {
    switch (role) {
      case UserRolesEnum.admin:
      case UserRolesEnum.superAdmin:
        return SignatureLevelsEnum.system;

      default:
        return SignatureLevelsEnum.bearer;
    }
  }

  getSignatures = ({
    signatureLevel,
  }: {
    signatureLevel: SignatureLevelsEnum;
  }): { accessSignature: string; refreshSignatrue: string } => {
    switch (signatureLevel) {
      case SignatureLevelsEnum.system:
        return {
          accessSignature: process.env.ACCESS_ADMIN_TOKEN_SIGNATURE!,
          refreshSignatrue: process.env.REFRESH_ADMIN_TOKEN_SIGNATURE!,
        };

      default:
        return {
          accessSignature: process.env.ACCESS_USER_TOKEN_SIGNATURE!,
          refreshSignatrue: process.env.REFRESH_USER_TOKEN_SIGNATURE!,
        };
    }
  };

  async getTokensBasedOnRole({
    user,
  }: {
    user: HydratedUser;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const signatures = this.getSignatures({
      signatureLevel: this.getSignatureLevel({ role: user.role }),
    });
    const jti: string = this._idService.generateAlphaNumaricId(); // jti = jwtId
    return {
      accessToken: await this.generate({
        payload: { sub: user.id, jti },
        options: {
          secret: signatures.accessSignature,
          expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        },
      }),
      refreshToken: await this.generate({
        payload: { sub: user.id, jti },
        options: {
          secret: signatures.refreshSignatrue,
          expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        },
      }),
    };
  }

  async decode({
    authorization,
    tokenType = TokenTypesEnum.access,
  }: {
    authorization: string;
    tokenType?: TokenTypesEnum;
  }): Promise<{ user: HydratedUser; payload: ITokenPayload }> {
    const [bearer, token] = authorization.split(' ');
    if (!bearer || !token) {
      throw new UnauthorizedException('Missing Token Parts ⛔');
    }

    if (
      !Object.values(SignatureLevelsEnum).includes(
        bearer as SignatureLevelsEnum,
      )
    ) {
      throw new BadRequestException('Invalid Bearer Key!');
    }

    const signatures = this.getSignatures({
      signatureLevel: bearer as SignatureLevelsEnum,
    });

    const payload = await this.verifiy({
      token,
      options: {
        secret:
          tokenType === TokenTypesEnum.refresh
            ? signatures.refreshSignatrue
            : signatures.accessSignature,
      },
    });
    if (!payload.sub || !payload.iat || !payload.jti) {
      throw new BadRequestException('Invalid Token Payload !');
    }

    if (
      await this._revokedTokenRepository.findOne({
        filter: { jti: payload.jti! },
      })
    ) {
      throw new BadRequestException('Token as been Revoked!');
    }
    const user = await this._userRepository.findOne({
      filter: { _id: payload.sub },
    });

    if (!user?.confirmedAt) {
      throw new BadRequestException('Invalid Account!');
    }

    if ((user?.changeCredentialsTime?.getTime() || 0) > payload.iat * 1000) {
      throw new BadRequestException('Token as been Revoked!');
    }

    return {
      user,
      payload,
    };
  }

  async revoke({
    flag = LogoutStatusEnum.one,
    userId,
    tokenPayload,
  }: {
    flag?: LogoutStatusEnum;
    userId: Types.ObjectId;
    tokenPayload: ITokenPayload;
  }): Promise<number> {
    let statusCode = 200;
    switch (flag) {
      case LogoutStatusEnum.all:
        await this._userRepository
          .updateOne({
            filter: { _id: userId },
            update: {
              changeCredentialsTime: Date.now(),
            },
          })
          .catch((err) => {
            throw new HttpException(
              { message: 'Failed to revoke Tokens!' },
              500,
            );
          });
        break;
      default:
        await this._revokedTokenRepository
          .create({
            data: [
              {
                jti: tokenPayload.jti!,
                expiresAt: new Date(
                  (tokenPayload.iat! +
                    Number(process.env.REFRESH_TOKEN_EXPIRES_IN)) *
                    1000,
                ),
                userId,
              },
            ],
          })
          .catch((err) => {
            throw new HttpException(
              { message: 'Failed to revoke Token!' },
              500,
            );
          });
        statusCode = 201;
        break;
    }
    return statusCode;
  }
}

export default TokenService;
