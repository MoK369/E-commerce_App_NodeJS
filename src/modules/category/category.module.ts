import { Module } from '@nestjs/common';
import { SharedAuthenticationModule } from 'src/common/modules';
import S3Module from 'src/common/modules/s3.module';
import CategoryController from './category.controller';
import CategoryService from './category.service';
import {
  BrandModel,
  BrandRepository,
  CategoryModel,
  CategoryRepository,
} from 'src/db';

@Module({
  imports: [SharedAuthenticationModule, S3Module, CategoryModel, BrandModel],
  exports: [],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, BrandRepository],
})
class CategoryModule {}

export default CategoryModule;
