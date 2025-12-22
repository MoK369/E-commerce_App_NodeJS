import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  GetAllAndSearchDto,
  ICategory,
  IdService,
  IPaginationResult,
  S3KeyService,
  S3Service,
  UploadFoldersEnum,
} from 'src/common';
import {
  BrandRepository,
  CategoryRepository,
  HydratedCategory,
  HydratedUser,
} from 'src/db';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';
import { Types } from 'mongoose';

@Injectable()
class CategoryService {
  constructor(
    private readonly _categoryRespository: CategoryRepository,
    private readonly _brandRepository: BrandRepository,
    private readonly _s3Service: S3Service,
    private readonly _s3KeyService: S3KeyService,
    private readonly _idService: IdService,
  ) {}

  private async _checkBrandsExistance(
    inputBrandIds: Types.ObjectId[] | undefined,
  ): Promise<Types.ObjectId[]> {
    const brands: Types.ObjectId[] = [...new Set(inputBrandIds || [])];
    if (
      brands?.length &&
      (await this._brandRepository.find({ filter: { _id: { $in: brands } } }))
        .length != brands.length
    ) {
      throw new NotFoundException('Some brandIds are not found 🔍❌');
    }

    return brands.map((id) =>
      Types.ObjectId.createFromHexString(id as unknown as string),
    );
  }

  async createCategory({
    body,
    file,
    user,
  }: {
    body: CreateCategoryDto;
    file: Express.Multer.File;
    user: HydratedUser;
  }): Promise<HydratedCategory> {
    const { name, description } = body;

    const checkDuplicated = await this._categoryRespository.findOne({
      filter: { name, paranoid: false },
    });

    if (checkDuplicated) {
      throw new ConflictException(
        checkDuplicated.freezedAt
          ? 'Duplicated Category Name with freezed Category ❌'
          : 'Duplicated Category Name ❌',
      );
    }

    const brands = await this._checkBrandsExistance(body.brands);

    const assetFolderId = this._idService.generateAlphaNumaricId();
    const SubKey = await this._s3Service.uploadFile({
      File: file,
      Path: `${UploadFoldersEnum.categories}/${assetFolderId}`,
    });

    const [category] = await this._categoryRespository.create({
      data: [
        {
          name,
          description,
          assetFolderId,
          image: SubKey,
          createdBy: user._id,
          brands,
        },
      ],
    });

    if (!category) {
      await this._s3Service.deleteFile({ SubKey });
      throw new InternalServerErrorException('Failed to created category ☹️');
    }
    return category;
  }

  async updateCategory({
    user,
    categoryId,
    body,
  }: {
    user: HydratedUser;
    categoryId: Types.ObjectId;
    body: UpdateCategoryDto;
  }): Promise<HydratedCategory> {
    const { name } = body;
    if (
      name &&
      (await this._categoryRespository.findOne({ filter: { name } }))
    ) {
      throw new ConflictException('Duplicated category name 🚫');
    }

    console.log({ body });

    const brands = await this._checkBrandsExistance(body.brands);

    const removeBrands = body?.removeBrands;
    delete body.removeBrands;
    delete body.brands;

    console.log({ body });

    const category = await this._categoryRespository.findOneAndUpdate<[]>({
      filter: { _id: categoryId },
      update: [
        {
          $set: {
            ...body,
            updatedBy: user._id,
            brands: {
              $setUnion: [
                {
                  $setDifference: [
                    '$brands',
                    removeBrands?.map((id) =>
                      Types.ObjectId.createFromHexString(
                        id as unknown as string,
                      ),
                    ) || [],
                  ],
                },
                brands,
              ],
            },
          },
        },
      ],
    });

    if (!category) {
      throw new NotFoundException('Invalid categoryId ❌');
    }

    return category;
  }

  async updateCategoryImage({
    categoryId,
    image,
    user,
  }: {
    categoryId: Types.ObjectId;
    image: Express.Multer.File;
    user: HydratedUser;
  }): Promise<ICategory['image']> {
    const category = await this._categoryRespository.findOne({
      filter: { _id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Invalid categoryId ❌');
    }

    const isThereOldImage: boolean = Boolean(category.image);
    const [_, newSubKey] = await Promise.all([
      isThereOldImage
        ? this._s3Service.deleteFile({ SubKey: category.image })
        : undefined,
      this._s3Service.uploadFile({
        File: image,
        Path: `${UploadFoldersEnum.categories}/${category.assetFolderId}`,
      }),
    ]);

    await category.updateOne({ image: newSubKey, updatedBy: user._id });

    return this._s3KeyService.generateS3UploadsUrlFromSubKey({
      req: { host: process.env.HOST!, protocol: process.env.PROTOCOL! },
      subKey: newSubKey,
    });
  }

  async freezeCategory({
    categoryId,
    user,
  }: {
    categoryId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<void> {
    const category = await this._categoryRespository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: {
        freezedAt: new Date(),
        $unset: { restoredAt: 1 },
        updatedBy: user._id,
      },
    });

    if (!category) {
      throw new NotFoundException('Invalid categoryId or already freezed ❌');
    }
  }

  async restoreCategory({
    categoryId,
    user,
  }: {
    categoryId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<HydratedCategory> {
    const category = await this._categoryRespository.findOneAndUpdate({
      filter: {
        _id: categoryId,
        paranoid: false,
        freezedAt: { $exists: true },
      },
      update: {
        restoredAt: new Date(),
        $unset: { freezedAt: 1 },
        updatedBy: user._id,
      },
    });

    if (!category) {
      throw new NotFoundException('Invalid categoryId or already restored ❌');
    }

    return category;
  }

  async removeCategory({
    categoryId,
  }: {
    categoryId: Types.ObjectId;
  }): Promise<void> {
    const category = await this._categoryRespository.findOneAndDelete({
      filter: {
        _id: categoryId,
        paranoid: false,
        freezedAt: { $exists: true },
      },
    });

    if (!category) {
      throw new NotFoundException(
        'Invalid categoryId, category not freezed, or category already removed ❌',
      );
    }

    await this._s3Service.deleteFile({ SubKey: category.image });
  }

  async findAllCategories({
    queryParams,
    archived = false,
  }: {
    queryParams: GetAllAndSearchDto;
    archived?: boolean;
  }): Promise<IPaginationResult<HydratedCategory>> {
    const result = await this._categoryRespository.paginate({
      filter: {
        ...(queryParams.searchKey
          ? {
              $or: [
                { name: { $regex: queryParams.searchKey, $options: 'i' } },
                { description: { $regex: queryParams.searchKey, $options: 'i' } },
                {
                  slug: { $regex: queryParams.searchKey, $options: 'i' },
                },
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
        archived
          ? 'No archived categories found 🔍❌'
          : 'No categories found 🔍❌',
      );
    }

    return result;
  }

  async findOneCategory({
    categoryId,
    archived,
  }: {
    categoryId: Types.ObjectId;
    archived?: boolean;
  }): Promise<HydratedCategory> {
    const category = await this._categoryRespository.findOne({
      filter: {
        _id: categoryId,
        ...(archived ? { paranoid: false, freezedAt: { $exists: true } } : {}),
      },
    });

    if (!category) {
      throw new NotFoundException(
        archived ? 'Archived Category NOT Found ❌' : 'Category NOT Found ❌',
      );
    }

    return category;
  }
}

export default CategoryService;
