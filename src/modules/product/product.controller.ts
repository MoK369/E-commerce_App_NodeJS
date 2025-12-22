import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import ProductService from './product.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  cloudFileUploadOptions,
  FilesMimeTypes,
  GetAllAndSearchDto,
  GetAllAndSearchResponse,
  IProduct,
  IResponse,
  StorageTypesEnum,
  successResponseHandler,
  User,
} from 'src/common';
import {
  ApplyAuthentication,
  CombinedAuth,
} from 'src/common/decorators/auths.decorator';
import productAuthorizationEndpoints from './product.authorization';
import { type HydratedUser } from 'src/db';
import {
  CreateProductDto,
  ProductParamsDto,
  RemoveFromWishlistDto,
  updateProductAttachmentsDto,
  UpdateProductDto,
} from './dto/product.dto';
import {
  ProductImagesResponse,
  ProductResponse,
} from './entities/product.entities';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('product')
class ProductController {
  constructor(private readonly _productService: ProductService) {}

  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      5,
      cloudFileUploadOptions({
        fileValidation: FilesMimeTypes.images,
        storageApproach: StorageTypesEnum.disk,
      }),
    ),
  )
  @CombinedAuth({
    accessRoles: productAuthorizationEndpoints.createAndUpdateProduct,
  })
  @Post()
  async createProduct(
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: HydratedUser,
    @Body() body: CreateProductDto,
  ): Promise<IResponse<ProductResponse>> {
    const product = await this._productService.createProduct({
      files,
      body,
      user,
    });

    return successResponseHandler<ProductResponse>({ data: { product } });
  }

  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      5,
      cloudFileUploadOptions({
        fileValidation: FilesMimeTypes.images,
        storageApproach: StorageTypesEnum.disk,
      }),
    ),
  )
  @CombinedAuth({
    accessRoles: productAuthorizationEndpoints.createAndUpdateProduct,
  })
  @Patch(':productId/attachments')
  async updateProductAttachments(
    @Param() params: ProductParamsDto,
    @UploadedFiles(new ParseFilePipe({ fileIsRequired: false }))
    files: Express.Multer.File[],
    @Body() body: updateProductAttachmentsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<ProductImagesResponse>> {
    return successResponseHandler<ProductImagesResponse>({
      data: {
        images: await this._productService.updateProductAttachments({
          productId: params.productId,
          files,
          body,
          user,
        }),
      },
    });
  }

  @CombinedAuth({
    accessRoles: productAuthorizationEndpoints.createAndUpdateProduct,
  })
  @Patch(':productId/restore')
  async restoreProduct(
    @Param() params: ProductParamsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<ProductResponse>> {
    const product = await this._productService.restoreProduct({
      productId: params.productId,
      user,
    });

    return successResponseHandler<ProductResponse>({
      message: 'Product restored successfully ✅',
      data: { product },
    });
  }

  @ApplyAuthentication()
  @Patch(':productId/add-to-wishlist')
  async addToWishlist(
    @Param() params: ProductParamsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse> {
    await this._productService.addToWishlist({
      productId: params.productId,
      user,
    });

    return successResponseHandler({
      message: 'Product Added to wishlist 🗑️✅',
    });
  }

  @ApplyAuthentication()
  @Patch('remove-from-wishlist')
  async removeFromWishlist(
    @Body() body: RemoveFromWishlistDto,
    @User() user: HydratedUser,
  ): Promise<IResponse> {
    await this._productService.removeFromWishlist({
      productIds: body.productIds,
      user,
    });

    return successResponseHandler({
      message: 'Product removed from wishlist 🗑️✅',
    });
  }

  @CombinedAuth({
    accessRoles: productAuthorizationEndpoints.createAndUpdateProduct,
  })
  @Patch(':productId')
  async updateProduct(
    @Param() params: ProductParamsDto,
    @Body() body: UpdateProductDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<ProductResponse>> {
    const product = await this._productService.updateProduct({
      productId: params.productId,
      body,
      user,
    });

    return successResponseHandler<ProductResponse>({ data: { product } });
  }

  @CombinedAuth({
    accessRoles: productAuthorizationEndpoints.createAndUpdateProduct,
  })
  @Delete(':productId/freeze')
  async freezeProduct(
    @Param() params: ProductParamsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse> {
    await this._productService.freezeProduct({
      productId: params.productId,
      user,
    });

    return successResponseHandler({
      message: 'Product freezed successfully ✅',
    });
  }

  @CombinedAuth({
    accessRoles: productAuthorizationEndpoints.createAndUpdateProduct,
  })
  @Delete(':productId')
  async removeProduct(@Param() params: ProductParamsDto): Promise<IResponse> {
    await this._productService.removeProduct({ productId: params.productId });

    return successResponseHandler({
      message: 'Product removed successfully ✅',
    });
  }

  @Get()
  async findAllProducts(
    @Query() queryParams: GetAllAndSearchDto,
  ): Promise<IResponse<GetAllAndSearchResponse<IProduct>>> {
    const result = await this._productService.findAllProducts({ queryParams });
    return successResponseHandler<GetAllAndSearchResponse<IProduct>>({
      data: result,
    });
  }

  @CombinedAuth({
    accessRoles: productAuthorizationEndpoints.createAndUpdateProduct,
  })
  @Get('/archives')
  async findAllArchives(
    @Query() queryParams: GetAllAndSearchDto,
  ): Promise<IResponse<GetAllAndSearchResponse<IProduct>>> {
    const result = await this._productService.findAllProducts({
      queryParams,
      archived: true,
    });
    return successResponseHandler<GetAllAndSearchResponse<IProduct>>({
      data: result,
    });
  }

  @CombinedAuth({
    accessRoles: productAuthorizationEndpoints.createAndUpdateProduct,
  })
  @Get(':productId/archived')
  async findArchivedProduct(
    @Param() params: ProductParamsDto,
  ): Promise<IResponse<ProductResponse>> {
    return successResponseHandler<ProductResponse>({
      data: {
        product: await this._productService.findOneProduct({
          productId: params.productId,
          archived: true,
        }),
      },
    });
  }

  @Get(':productId')
  async findProduct(
    @Param() params: ProductParamsDto,
  ): Promise<IResponse<ProductResponse>> {
    return successResponseHandler<ProductResponse>({
      data: {
        product: await this._productService.findOneProduct({
          productId: params.productId,
        }),
      },
    });
  }
}

export default ProductController;
