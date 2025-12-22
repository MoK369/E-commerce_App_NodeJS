import { Module } from '@nestjs/common';
import { SharedAuthenticationModule } from 'src/common/modules';
import S3Module from 'src/common/modules/s3.module';
import { CouponModel, CouponRepository } from 'src/db';
import CouponController from './coupon.controller';
import CouponService from './coupon.service';

@Module({
  imports: [SharedAuthenticationModule, S3Module, CouponModel],
  exports: [],
  controllers: [CouponController],
  providers: [CouponService, CouponRepository],
})
class CouponModule {}

export default CouponModule;
