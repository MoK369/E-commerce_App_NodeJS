import { Module } from '@nestjs/common';
import BrandService from './brand.service';
import BrandController from './brand.controller';
import { BrandModel, BrandRepository } from 'src/db';
import { S3KeyService, S3Service } from 'src/common';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports: [SharedAuthenticationModule, BrandModel],
  exports: [],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository, S3Service, S3KeyService],
})
class BrandModule {}

export default BrandModule;
