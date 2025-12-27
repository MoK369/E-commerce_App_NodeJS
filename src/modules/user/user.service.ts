import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ITokenPayload,
  IUser,
  ProvidersEnum,
  S3KeyService,
  S3Service,
  UserRolesEnum,
} from 'src/common';
import {
  CartRepository,
  type HydratedUser,
  OrderRepository,
  OtpRepository,
  UserRepository,
} from 'src/db';
import { ChangeRoleBodyDto, LogoutBodyDto } from './dto/user.dto';
import TokenService from 'src/common/services/security/token.security';
import { Types, UpdateQuery } from 'mongoose';

@Injectable()
class UserService {
  constructor(
    private readonly _userRepository: UserRepository,
    private readonly _cartRepository: CartRepository,
    private readonly _otpRepository: OtpRepository,
    private readonly _orderRepository: OrderRepository,
    private readonly _s3Service: S3Service,
    private readonly _s3KeyService: S3KeyService,
    private readonly _tokenService: TokenService,
  ) {}

  async profileImage(
    File: Express.Multer.File,
    user: HydratedUser,
  ): Promise<{ url: string; provider: ProvidersEnum }> {
    const [_, subKey] = await Promise.all([
      user?.profileImage?.url &&
      user?.profileImage?.provider == ProvidersEnum.local
        ? this._s3Service.deleteFile({ SubKey: user.profileImage.url })
        : undefined,
      this._s3Service.uploadFile({
        File,
        Path: `users/${user._id.toString()}/profile`,
      }),
    ]);

    user.profileImage = {
      url: subKey,
      provider: ProvidersEnum.local,
    };

    await user.save();
    user.profileImage.url = this._s3KeyService.generateS3UploadsUrlFromSubKey({
      req: { host: process.env.HOST!, protocol: process.env.PROTOCOL! },
      subKey,
    });

    return user.profileImage;
  }

  async logout({
    body,
    user,
    payload,
  }: {
    body: LogoutBodyDto;
    user: HydratedUser;
    payload: ITokenPayload;
  }): Promise<number> {
    const { flag } = body;
    console.log({ flag });

    return await this._tokenService.revoke({
      flag,
      userId: user._id,
      tokenPayload: payload,
    });
  }

  async refreshToken({
    user,
    payload,
  }: {
    user: HydratedUser;
    payload: ITokenPayload;
  }): Promise<{
    statusCode: number;
    accessToken: string;
    refreshToken: string;
  }> {
    const newTokens = await this._tokenService.getTokensBasedOnRole({
      user,
    });
    const statusCode = await this._tokenService.revoke({
      userId: user._id,
      tokenPayload: payload,
    });
    return { statusCode, ...newTokens };
  }

  async changeRole({
    userId,
    body,
    user,
  }: {
    userId: Types.ObjectId;
    user: HydratedUser;
    body: ChangeRoleBodyDto;
  }): Promise<void> {
    const denyRoles: UserRolesEnum[] = [body.role, UserRolesEnum.superAdmin];
    if (user.role === UserRolesEnum.admin) {
      if (body.role === UserRolesEnum.superAdmin) {
        throw new ForbiddenException(
          "You don't have the privilage to make a user Super Admin",
        );
      }

      denyRoles.push(UserRolesEnum.admin);
    }

    const changedUser = await this._userRepository.findOneAndUpdate({
      filter: { _id: userId, role: { $nin: denyRoles } },
      update: {
        role: body.role,
      },
    });

    if (!changedUser) {
      throw new NotFoundException('Invalid userId or invalid role');
    }
  }

  async freezeAccount({
    userId,
    user,
  }: {
    userId?: Types.ObjectId;
    user: HydratedUser;
  }): Promise<void> {
    if (userId && user.role === UserRolesEnum.user) {
      throw new ForbiddenException('Not Authorized User');
    }

    const updateObject: UpdateQuery<IUser> = {
      freezedAt: new Date(),
      updatedBy: user._id,
      changeCredentialsTime: new Date(),
      $unset: {
        restoredAt: true,
      },
    };

    if (userId) {
      const otherUser = await this._userRepository.findOne({
        filter: {
          _id: userId,
        },
      });

      if (!otherUser) {
        throw new NotFoundException('user not found or already freezed');
      }
      if (
        user.role === otherUser.role ||
        otherUser.role === UserRolesEnum.superAdmin
      ) {
        throw new ForbiddenException(
          "You don't have the privilages to freeze this account",
        );
      }

      await otherUser.updateOne(updateObject);
    } else {
      await user.updateOne(updateObject);
    }
  }

  async restoreAccount({
    userId,
    user,
  }: {
    userId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<void> {
    const result = await this._userRepository.updateOne({
      filter: {
        _id: userId,
        paranoid: false,
        freezedAt: { $exists: true },
        updatedBy: { $ne: userId },
      },
      update: {
        restoredAt: new Date(),
        updatedBy: user._id,
        $unset: {
          freezedAt: true,
        },
      },
    });

    if (result.modifiedCount === 0) {
      throw new NotFoundException(
        'user not found or already restored or this user has freezed his account',
      );
    }
  }

  async hardDeleteAccount({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<void> {
    const user = await this._userRepository.findOneAndDelete({
      filter: {
        _id: userId,
        paranoid: false,
        freezedAt: { $exists: true },
      },
    });

    if (!user) {
      throw new NotFoundException('invalid user account or already deleted');
    }

    await Promise.all([
      this._userRepository.updateMany({
        filter: {
          friends: { $in: [userId] },
        },
        update: {
          $pull: { friends: userId },
        },
      }),
      this._otpRepository.deleteMany({
        filter: {
          createdBy: userId,
        },
      }),
      this._cartRepository.deleteMany({
        filter: {
          createdBy: userId,
        },
      }),
      this._orderRepository.deleteMany({ filter: { createdBy: userId } }),
      user?.profileImage?.url
        ? this._s3Service.deleteFolderByPrefix({
            FolderPath: `users/${userId}`,
          })
        : undefined,
    ]);
  }
}

export default UserService;
