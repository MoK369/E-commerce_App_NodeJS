import { Module } from '@nestjs/common';
import { SharedAuthenticationModule } from 'src/common/modules';
import S3Module from 'src/common/modules/s3.module';
import {
  BrandModel,
  BrandRepository,
  CategoryModel,
  CategoryRepository,
  ProductModel,
  ProductRepository,
} from 'src/db';
import ProductController from './product.controller';
import ProductService from './product.service';

@Module({
  imports: [
    SharedAuthenticationModule,
    S3Module,
    ProductModel,
    BrandModel,
    CategoryModel,
  ],
  exports: [],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    BrandRepository,
    CategoryRepository,
  ],
})
class ProductModule {}

export default ProductModule;
