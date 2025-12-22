import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  GetAllAndSearchDto,
  IdService,
  IPaginationResult,
  IProduct,
  S3KeyService,
  S3Service,
  StorageTypesEnum,
  UploadFoldersEnum,
} from 'src/common';
import {
  ProductRepository,
  CategoryRepository,
  HydratedCategory,
  HydratedProduct,
  type HydratedUser,
  UserRepository,
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
    private readonly _userRepository: UserRepository,
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
      !(await this._productRepository.findOne({
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
      !(await this._productRepository.findOne({
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

  async freezeProduct({
    productId,
    user,
  }: {
    productId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<void> {
    const product = await this._productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: {
        freezedAt: new Date(),
        $unset: { restoredAt: 1 },
        updatedBy: user._id,
      },
    });

    if (!product) {
      throw new NotFoundException('Invalid productId or already freezed ❌');
    }
  }

  async restoreProduct({
    productId,
    user,
  }: {
    productId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<HydratedProduct> {
    const product = await this._productRepository.findOneAndUpdate({
      filter: { _id: productId, paranoid: false, freezedAt: { $exists: true } },
      update: {
        restoredAt: new Date(),
        $unset: { freezedAt: 1 },
        updatedBy: user._id,
      },
    });

    if (!product) {
      throw new NotFoundException('Invalid productId or already restored ❌');
    }

    return product;
  }

  async removeProduct({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<void> {
    const product = await this._productRepository.findOneAndDelete({
      filter: { _id: productId, paranoid: false, freezedAt: { $exists: true } },
    });

    if (!product) {
      throw new NotFoundException(
        'Invalid productId, product not freezed, or product already removed ❌',
      );
    }

    await this._s3Service.deleteFiles({ SubKeys: product.images });
  }

  async findAllProducts({
    queryParams,
    archived = false,
  }: {
    queryParams: GetAllAndSearchDto;
    archived?: boolean;
  }): Promise<IPaginationResult<HydratedProduct>> {
    const result = await this._productRepository.paginate({
      filter: {
        ...(queryParams.searchKey
          ? {
              $or: [
                { name: { $regex: queryParams.searchKey, $options: 'i' } },
                { slug: { $regex: queryParams.searchKey, $options: 'i' } },
                {
                  description: { $regex: queryParams.searchKey, $options: 'i' },
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
        archived ? 'No archived products found 🔍❌' : 'No products found 🔍❌',
      );
    }

    return result;
  }

  async findOneProduct({
    productId,
    archived,
  }: {
    productId: Types.ObjectId;
    archived?: boolean;
  }): Promise<HydratedProduct> {
    const product = await this._productRepository.findOne({
      filter: {
        _id: productId,
        ...(archived ? { paranoid: false, freezedAt: { $exists: true } } : {}),
      },
    });

    if (!product) {
      throw new NotFoundException('Product NOT Found ❌');
    }

    return product;
  }

  async addToWishlist({
    productId,
    user,
  }: {
    productId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<void> {
    const product = await this._productRepository.findOne({
      filter: {
        _id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product NOT Found ❌');
    }

    if (user?.wishlist?.length) {
      if (user.wishlist.length >= 500)
        throw new BadRequestException(
          'Wishlist reach it full length (500 items) ❌',
        );

      if ((user.wishlist as Types.ObjectId[]).includes(product._id))
        throw new ConflictException('Product already add to wishlist ⛔');
    }

    await this._userRepository.updateOne({
      filter: { _id: user._id },
      update: { $addToSet: { wishlist: product._id } },
    });
  }

  async removeFromWishlist({
    productIds,
    user,
  }: {
    productIds: Types.ObjectId[];
    user: HydratedUser;
  }): Promise<void> {
    await this._userRepository.updateOne({
      filter: { _id: user._id },
      update: {
        $pullAll: {
          wishlist: productIds.map((pro) =>
            Types.ObjectId.createFromHexString(pro as unknown as string),
          ),
        },
      },
    });
  }
}

export default ProductService;
