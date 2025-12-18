import {Module } from '@nestjs/common';
import BrandService from './brand.service';
import BrandController from './brand.controller';
import { BrandModel, BrandRepository } from 'src/db';
import { SharedAuthenticationModule } from 'src/common/modules';
import S3Module from 'src/common/modules/s3.module';

@Module({
  imports: [SharedAuthenticationModule, BrandModel, S3Module],
  exports: [],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository],
})
class BrandModule {}

export default BrandModule;
