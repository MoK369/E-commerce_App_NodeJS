import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCouponDto } from './dto/coupon.dto';
import { CouponRepository, HydratedCoupon, HydratedUser } from 'src/db';
import { S3Service, UploadFoldersEnum } from 'src/common';

@Injectable()
class CouponService {
  constructor(
    private readonly _couponRepository: CouponRepository,
    private readonly _s3Service: S3Service,
  ) {}

  async createCoupon({
    file,
    body,
    user,
  }: {
    file: Express.Multer.File;
    body: CreateCouponDto;
    user: HydratedUser;
  }): Promise<HydratedCoupon> {
    if (
      await this._couponRepository.findOne({
        filter: { name: body.name, paranoid: false },
      })
    ) {
      throw new ConflictException('Duplicated Coupon Name ❌');
    }

    const subKey = await this._s3Service.uploadFile({
      File: file,
      Path: `${UploadFoldersEnum.coupons}`,
    });

    const [coupon] = await this._couponRepository.create({
      data: [
        {
          ...body,
          image: subKey,
          createdBy: user._id,
        },
      ],
    });

    if (!coupon) {
      await this._s3Service.deleteFile({ SubKey: subKey });
      throw new InternalServerErrorException('Failed to create coupon ☹️');
    }

    return coupon;
  }
}

export default CouponService;
