import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BrandRepository, HydratedBrand, HydratedUser } from 'src/db';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import {
  GetAllAndSearchDto,
  IBrand,
  IPaginationResult,
  S3KeyService,
  S3Service,
  UploadFoldersEnum,
} from 'src/common';
import { Types } from 'mongoose';

@Injectable()
class BrandService {
  constructor(
    private readonly _brandRepository: BrandRepository,
    private readonly _s3Service: S3Service,
    private readonly _s3KeyService: S3KeyService,
  ) {}

  private async _checkForDuplicatedBrandName(name?: string): Promise<void> {
    if (!name) return;
    const checkDuplicated = await this._brandRepository.findOne({
      filter: { name, paranoid: false },
    });

    if (checkDuplicated) {
      throw new ConflictException(
        checkDuplicated.freezedAt
          ? 'Duplicated Brand Name with freezed Brand ❌'
          : 'Duplicated Brand Name ❌',
      );
    }
  }

  async createBrand({
    body,
    file,
    user,
  }: {
    body: CreateBrandDto;
    file: Express.Multer.File;
    user: HydratedUser;
  }): Promise<HydratedBrand> {
    const { name, slogan } = body;

    await this._checkForDuplicatedBrandName(name);

    const SubKey = await this._s3Service.uploadFile({
      File: file,
      Path: UploadFoldersEnum.brands,
    });

    const [brand] = await this._brandRepository.create({
      data: [{ name, slogan, image: SubKey, createdBy: user._id }],
    });

    if (!brand) {
      await this._s3Service.deleteFile({ SubKey });
      throw new InternalServerErrorException('Failed to created brand ☹️');
    }
    return brand;
  }

  async updateBrand({
    user,
    brandId,
    body,
  }: {
    user: HydratedUser;
    brandId: Types.ObjectId;
    body: UpdateBrandDto;
  }): Promise<HydratedBrand> {
    await this._checkForDuplicatedBrandName(body.name);

    const brand = await this._brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      update: {
        ...body,
        updatedBy: user._id,
      },
    });

    if (!brand) {
      throw new NotFoundException('Invalid brandId ❌');
    }

    return brand;
  }

  async updateBrandImage({
    brandId,
    image,
    user,
  }: {
    brandId: Types.ObjectId;
    image: Express.Multer.File;
    user: HydratedUser;
  }): Promise<IBrand['image']> {
    const brand = await this._brandRepository.findOne({
      filter: { _id: brandId },
    });
    if (!brand) {
      throw new NotFoundException('Invalid brandId ❌');
    }

    const isThereOldImage: boolean = Boolean(brand.image);
    const [_, newSubKey] = await Promise.all([
      isThereOldImage
        ? this._s3Service.deleteFile({ SubKey: brand.image })
        : undefined,
      this._s3Service.uploadFile({
        File: image,
        Path: UploadFoldersEnum.brands,
      }),
    ]);

    await brand.updateOne({ image: newSubKey, updatedBy: user._id });

    return this._s3KeyService.generateS3UploadsUrlFromSubKey({
      req: { host: process.env.HOST!, protocol: process.env.PROTOCOL! },
      subKey: newSubKey,
    });
  }

  async freezeBrand({
    brandId,
    user,
  }: {
    brandId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<void> {
    const brand = await this._brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      update: {
        freezedAt: new Date(),
        $unset: { restoredAt: 1 },
        updatedBy: user._id,
      },
    });

    if (!brand) {
      throw new NotFoundException('Invalid brandId or already freezed ❌');
    }
  }

  async restoreBrand({
    brandId,
    user,
  }: {
    brandId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<HydratedBrand> {
    const brand = await this._brandRepository.findOneAndUpdate({
      filter: { _id: brandId, paranoid: false, freezedAt: { $exists: true } },
      update: {
        restoredAt: new Date(),
        $unset: { freezedAt: 1 },
        updatedBy: user._id,
      },
    });

    if (!brand) {
      throw new NotFoundException('Invalid brandId or already restored ❌');
    }

    return brand;
  }

  async removeBrand({ brandId }: { brandId: Types.ObjectId }): Promise<void> {
    const brand = await this._brandRepository.findOneAndDelete({
      filter: { _id: brandId, paranoid: false, freezedAt: { $exists: true } },
    });

    if (!brand) {
      throw new NotFoundException(
        'Invalid brandId, brand not freezed, or brand already removed ❌',
      );
    }

    await this._s3Service.deleteFile({ SubKey: brand.image });
  }

  async findAllBrands({
    queryParams,
    archived = false,
  }: {
    queryParams: GetAllAndSearchDto;
    archived?: boolean;
  }): Promise<IPaginationResult<HydratedBrand>> {
    const result = await this._brandRepository.paginate({
      filter: {
        ...(queryParams.searchKey
          ? {
              $or: [
                { name: { $regex: queryParams.searchKey, $options: 'i' } },
                { slogan: { $regex: queryParams.searchKey, $options: 'i' } },
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
        archived ? 'No archived brands found 🔍❌' : 'No brands found 🔍❌',
      );
    }

    return result;
  }

  async findOneBrand({
    brandId,
    archived,
  }: {
    brandId: Types.ObjectId;
    archived?: boolean;
  }): Promise<HydratedBrand> {
    const brand = await this._brandRepository.findOne({
      filter: {
        _id: brandId,
        ...(archived ? { paranoid: false, freezedAt: { $exists: true } } : {}),
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand NOT Found ❌');
    }

    return brand;
  }
}

export default BrandService;
