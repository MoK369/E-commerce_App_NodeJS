import { Module } from '@nestjs/common';
import { SharedAuthenticationModule } from 'src/common/modules';
import S3Module from 'src/common/modules/s3.module';
import { CouponModel, CouponRepository } from 'src/db';
import CouponController from './coupon.controller';
import CouponService from './coupon.service';
import { CheckAfterDate } from 'src/common/decorators/after_date.decorator';

@Module({
  imports: [SharedAuthenticationModule, S3Module, CouponModel],
  exports: [],
  controllers: [CouponController],
  providers: [CouponService, CouponRepository, CheckAfterDate],
})
class CouponModule {}

export default CouponModule;
