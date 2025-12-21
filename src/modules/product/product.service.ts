import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  IdService,
  IProduct,
  S3KeyService,
  S3Service,
  StorageTypesEnum,
  UploadFoldersEnum,
} from 'src/common';
import {
  BrandRepository,
  CategoryRepository,
  HydratedCategory,
  HydratedProduct,
  type HydratedUser,
  ProductRepository,
} from 'src/db';
import {
  CreateProductDto,
  updateProductAttachmentsDto,
  UpdateProductDto,
} from './dto/product.dto';
import { Types } from 'mongoose';

@Injectable()
class ProductService {
  constructor(
    private readonly _productRepository: ProductRepository,
    private readonly _categoryRepository: CategoryRepository,
    private readonly _brandRepository: BrandRepository,
    private readonly _s3Service: S3Service,
    private readonly _s3KeyService: S3KeyService,
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

  async updateProduct({
    productId,
    body,
    user,
  }: {
    productId: Types.ObjectId;
    body: UpdateProductDto;
    user: HydratedUser;
  }): Promise<HydratedProduct> {
    const product = await this._productRepository.findOne({
      filter: { _id: productId },
    });

    if (!product) {
      throw new NotFoundException('Invalid productId ⛔');
    }

    if (
      body.category &&
      !(await this._categoryRepository.findOne({
        filter: { _id: body.category },
      }))
    ) {
      throw new NotFoundException('Invalid categoryId ⛔');
    }
    if (
      body.brand &&
      !(await this._brandRepository.findOne({
        filter: { _id: body.brand },
      }))
    ) {
      throw new NotFoundException('Invalid brandId ⛔');
    }

    return (await this._productRepository.findByIdAndUpdate({
      id: productId,
      update: { ...body, updatedBy: user._id },
    }))!;
  }

  async updateProductAttachments({
    productId,
    files,
    body,
    user,
  }: {
    productId: Types.ObjectId;
    files?: Express.Multer.File[];
    body: updateProductAttachmentsDto;
    user: HydratedUser;
  }): Promise<IProduct['images']> {
    const product = await this._productRepository.findOne({
      filter: { _id: productId },
      options: { populate: [{ path: 'category', select: 'assetFolderId' }] },
    });

    if (!product) {
      throw new NotFoundException('Invalid productId ⛔');
    }

    if (!files?.length && !body?.removeAttachments?.length) {
      throw new BadRequestException('Nothing to update ❌');
    }

    const attachments = [...product.images];

    console.log('before: ', { attachments });

    if (body?.removeAttachments?.length) {
      for (let i = 0; i < attachments.length; i++) {
        console.log('length: ', attachments.length);

        if (body.removeAttachments.includes(attachments[i])) {
          console.log(i, attachments[i]);

          attachments.splice(i, 1);
          i--;
        }
      }
    }

    console.log('after: ', { attachments });

    if (attachments.length + (files?.length ?? 0) > 5) {
      throw new PayloadTooLargeException(
        'A product should have at most 5 images ❌',
      );
    }

    const [_, subKeys] = await Promise.all([
      body?.removeAttachments?.length && product.images?.length
        ? await this._s3Service.deleteFiles({ SubKeys: body.removeAttachments })
        : undefined,
      files?.length
        ? await this._s3Service.uploadFiles({
            StorageApproach: StorageTypesEnum.disk,
            Files: files,
            Path: `${UploadFoldersEnum.categories}/${(product.category as unknown as HydratedCategory).assetFolderId}/${UploadFoldersEnum.products}/${product.assetFolderId}`,
          })
        : undefined,
    ]);

    attachments.push(...(subKeys ?? []));

    await product.updateOne({ images: attachments, updatedBy: user._id });

    return attachments.map((subKey) =>
      this._s3KeyService.generateS3UploadsUrlFromSubKey({
        req: { host: process.env.HOST!, protocol: process.env.PROTOCOL! },
        subKey,
      }),
    );
  }
}

export default ProductService;
