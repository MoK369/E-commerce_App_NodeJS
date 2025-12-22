import { Injectable } from '@nestjs/common';
import { ProvidersEnum, S3Service } from 'src/common';
import type { HydratedUser } from 'src/db';

@Injectable()
class UserService {
  constructor(private _s3Service: S3Service) {}

  async profileImage(
    File: Express.Multer.File,
    user: HydratedUser,
  ): Promise<{ url: string; provider: ProvidersEnum }> {
    user.profileImage = {
      url: await this._s3Service.uploadFile({
        File,
        Path: `users/${user._id.toString()}/profile`,
      }),
      provider: ProvidersEnum.local,
    };

    await user.save();
    return user.profileImage;
  }
}

export default UserService;
