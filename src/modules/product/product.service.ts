import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  IdService,
  S3Service,
  StorageTypesEnum,
  UploadFoldersEnum,
} from 'src/common';
import {
  BrandRepository,
  CategoryRepository,
  HydratedProduct,
  type HydratedUser,
  ProductRepository,
} from 'src/db';
import { CreateProductDto } from './dto/product.dto';

@Injectable()
class ProductService {
  constructor(
    private readonly _productRepository: ProductRepository,
    private readonly _categoryRepository: CategoryRepository,
    private readonly _brandRepository: BrandRepository,
    private readonly _s3Service: S3Service,
    private readonly _idService: IdService,
  ) {}

  async createProduct({
    files,
    body,
    user,
  }: {
    files: Express.Multer.File[];
    body: CreateProductDto;
    user: HydratedUser;
  }): Promise<HydratedProduct> {
    const category = await this._categoryRepository.findOne({
      filter: { _id: body.category },
    });
    if (!category) {
      throw new NotFoundException('Invalid categoryId ⛔');
    }

    if (
      !(await this._brandRepository.findOne({
        filter: { _id: body.brand },
      }))
    ) {
      throw new NotFoundException('Invalid brandId ⛔');
    }

    const assetFolderId = this._idService.generateAlphaNumaricId();
    const subKeys = await this._s3Service.uploadFiles({
      Files: files,
      StorageApproach: StorageTypesEnum.disk,
      Path: `${UploadFoldersEnum.categories}/${category.assetFolderId}/${UploadFoldersEnum.products}/${assetFolderId}`,
    });

    const [product] = await this._productRepository.create({
      data: [
        {
          ...body,
          assetFolderId,
          images: subKeys,
          createdBy: user._id,
        },
      ],
    });

    if (!product) {
      await this._s3Service.deleteFolderByPrefix({
        FolderPath: `${UploadFoldersEnum.categories}/${category.assetFolderId}/${UploadFoldersEnum.products}/${assetFolderId}`,
      });
      throw new InternalServerErrorException(
        'Failed to create this product 🙁',
      );
    }

    return product;
  }
}

export default ProductService;
