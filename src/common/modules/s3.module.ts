import { Module } from '@nestjs/common';
import { IdService, S3KeyService, S3Service } from '../services';

@Module({
  imports: [],
  providers: [S3Service, S3KeyService, IdService],
  exports: [S3Service, S3KeyService],
})
class S3Module {}

export default S3Module;