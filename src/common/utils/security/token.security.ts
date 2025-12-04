import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { SignatureLevelsEnum, UserRolesEnum } from 'src/common/enums';
import { HydratedUser, UserRepository } from 'src/db';
import IdService from './id.security';

export interface ITokenPayload {
  sub: Types.ObjectId;
  jti: string;
}

@Injectable()
class TokenService {
  constructor(
    private readonly _idService: IdService,
    private readonly jwtService: JwtService,
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
    return this.jwtService.signAsync(payload, options);
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
    return this.jwtService.verifyAsync(
      token,
      options,
    ) as unknown as Promise<ITokenPayload>;
  }

  getSignatureLevel({ role }: { role: UserRolesEnum }): SignatureLevelsEnum {
    switch (role) {
      case UserRolesEnum.admin:
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
          accessSignature: process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE!,
          refreshSignatrue: process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE!,
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
}

export default TokenService;
