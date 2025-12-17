import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { BrandRepository, HydratedBrand, HydratedUser } from 'src/db';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { S3Service } from 'src/common';
import { Types } from 'mongoose';

@Injectable()
class BrandService {
  constructor(
    private readonly _brandRepository: BrandRepository,
    private readonly _s3Service: S3Service,
  ) {}

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

    const checkDuplicated = await this._brandRepository.findOne({
      filter: { name },
    });

    if (checkDuplicated) {
      throw new ConflictException('Duplicated Brand Name ❌');
    }

    const SubKey = await this._s3Service.uploadFile({
      File: file,
      Path: `brands`,
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

  async updateBrand({brandId,body}: { brandId: Types.ObjectId; body: UpdateBrandDto }) {}
}

export default BrandService;
