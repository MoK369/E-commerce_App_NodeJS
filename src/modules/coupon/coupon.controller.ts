import {
  Body,
  Controller,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import CouponService from './coupon.service';
import { CombinedAuth } from 'src/common/decorators/auths.decorator';
import couponAuthorizationEndpoints from './coupon.authorization';
import {
  cloudFileUploadOptions,
  FilesMimeTypes,
  IResponse,
  successResponseHandler,
  User,
} from 'src/common';
import { type HydratedUser } from 'src/db';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCouponDto } from './dto/coupon.dto';
import { CouponResponse } from './entities/coupon.entities';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('coupon')
class CouponController {
  constructor(private readonly _couponService: CouponService) {}

  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudFileUploadOptions({ fileValidation: FilesMimeTypes.images }),
    ),
  )
  @CombinedAuth({ accessRoles: couponAuthorizationEndpoints.createCoupon })
  @Post()
  async createCoupon(
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @Body() body: CreateCouponDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<CouponResponse>> {
    const coupon = await this._couponService.createCoupon({ file, body, user });

    return successResponseHandler<CouponResponse>({ data: { coupon } });
  }
}

export default CouponController;
