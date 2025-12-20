import {
  Body,
  Controller,
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
import { CreateProductDto } from './dto/product.dto';
import { ProductResponse } from './entities/product.entities';

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
  @CombinedAuth({ accessRoles: productAuthorizationEndpoints.createProduct })
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
}

export default ProductController;
