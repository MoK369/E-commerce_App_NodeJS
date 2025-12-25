import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';
import { CouponRepository, HydratedCoupon, HydratedUser } from 'src/db';
import {
  GetAllAndSearchDto,
  ICoupon,
  IPaginationResult,
  S3KeyService,
  S3Service,
  UploadFoldersEnum,
} from 'src/common';
import { Types } from 'mongoose';

@Injectable()
class CouponService {
  constructor(
    private readonly _couponRepository: CouponRepository,
    private readonly _s3Service: S3Service,
    private readonly _s3KeyService: S3KeyService,
  ) {}

  private async _checkForDuplicatedCouponName(name?: string): Promise<void> {
    if (!name) return;
    const checkDuplicated = await this._couponRepository.findOne({
      filter: { name, paranoid: false },
    });

    if (checkDuplicated) {
      throw new ConflictException(
        checkDuplicated.freezedAt
          ? 'Duplicated Coupon Name with freezed Coupon ❌'
          : 'Duplicated Coupon Name ❌',
      );
    }
  }

  async createCoupon({
    file,
    body,
    user,
  }: {
    file: Express.Multer.File;
    body: CreateCouponDto;
    user: HydratedUser;
  }): Promise<HydratedCoupon> {
    await this._checkForDuplicatedCouponName(body.name);

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

  async updateCoupon({
    user,
    couponId,
    body,
  }: {
    user: HydratedUser;
    couponId: Types.ObjectId;
    body: UpdateCouponDto;
  }): Promise<HydratedCoupon> {
    await this._checkForDuplicatedCouponName(body.name);

    const coupon = await this._couponRepository.findOneAndUpdate({
      filter: { _id: couponId },
      update: {
        ...body,
        updatedBy: user._id,
      },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid couponId ❌');
    }

    return coupon;
  }

  async updateCouponImage({
    couponId,
    image,
    user,
  }: {
    couponId: Types.ObjectId;
    image: Express.Multer.File;
    user: HydratedUser;
  }): Promise<ICoupon['image']> {
    const coupon = await this._couponRepository.findOne({
      filter: { _id: couponId },
    });
    if (!coupon) {
      throw new NotFoundException('Invalid couponId or freezed ❌');
    }

    const isThereOldImage: boolean = Boolean(coupon.image);
    const [_, newSubKey] = await Promise.all([
      isThereOldImage
        ? this._s3Service.deleteFile({ SubKey: coupon.image })
        : undefined,
      this._s3Service.uploadFile({
        File: image,
        Path: UploadFoldersEnum.coupons,
      }),
    ]);

    await coupon.updateOne({ image: newSubKey, updatedBy: user._id });

    return this._s3KeyService.generateS3UploadsUrlFromSubKey({
      req: { host: process.env.HOST!, protocol: process.env.PROTOCOL! },
      subKey: newSubKey,
    });
  }

  async freezeCoupon({
    couponId,
    user,
  }: {
    couponId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<void> {
    const coupon = await this._couponRepository.findOneAndUpdate({
      filter: { _id: couponId },
      update: {
        freezedAt: new Date(),
        $unset: { restoredAt: 1 },
        updatedBy: user._id,
      },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid couponId or already freezed ❌');
    }
  }

  async restoreCoupon({
    couponId,
    user,
  }: {
    couponId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<HydratedCoupon> {
    const coupon = await this._couponRepository.findOneAndUpdate({
      filter: { _id: couponId, paranoid: false, freezedAt: { $exists: true } },
      update: {
        restoredAt: new Date(),
        $unset: { freezedAt: 1 },
        updatedBy: user._id,
      },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid couponId or already restored ❌');
    }

    return coupon;
  }

  async removeCoupon({
    couponId,
  }: {
    couponId: Types.ObjectId;
  }): Promise<void> {
    const coupon = await this._couponRepository.findOneAndDelete({
      filter: { _id: couponId, paranoid: false, freezedAt: { $exists: true } },
    });

    if (!coupon) {
      throw new NotFoundException(
        'Invalid couponId, coupon not freezed, or coupon already removed ❌',
      );
    }

    await this._s3Service.deleteFile({ SubKey: coupon.image });
  }

  async findAllCoupons({
    queryParams,
    archived = false,
  }: {
    queryParams: GetAllAndSearchDto;
    archived?: boolean;
  }): Promise<IPaginationResult<HydratedCoupon>> {
    const result = await this._couponRepository.paginate({
      filter: {
        ...(queryParams.searchKey
          ? {
              $or: [
                { name: { $regex: queryParams.searchKey, $options: 'i' } },
                { slug: { $regex: queryParams.searchKey, $options: 'i' } },
              ],
            }
          : {}),

        ...(archived ? { paranoid: false, freezedAt: { $exists: true } } : {}),
      },
      page: queryParams.page || 1,
      size: queryParams.size || 10,
    });
    if (!result.data || result.data.length == 0) {
      throw new NotFoundException(
        archived ? 'No archived coupons found 🔍❌' : 'No coupons found 🔍❌',
      );
    }

    return result;
  }

  async findOneCoupon({
    couponId,
    archived,
  }: {
    couponId: Types.ObjectId;
    archived?: boolean;
  }): Promise<HydratedCoupon> {
    const coupon = await this._couponRepository.findOne({
      filter: {
        _id: couponId,
        ...(archived ? { paranoid: false, freezedAt: { $exists: true } } : {}),
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon NOT Found ❌');
    }

    return coupon;
  }
}

export default CouponService;
