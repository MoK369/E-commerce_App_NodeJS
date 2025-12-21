import {
  Body,
  Controller,
  Param,
  ParseFilePipe,
  Patch,
  Post,
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
  IResponse,
  StorageTypesEnum,
  successResponseHandler,
  User,
} from 'src/common';
import { CombinedAuth } from 'src/common/decorators/auths.decorator';
import productAuthorizationEndpoints from './product.authorization';
import { type HydratedUser } from 'src/db';
import {
  CreateProductDto,
  ProductParamsDto,
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
}

export default ProductController;
