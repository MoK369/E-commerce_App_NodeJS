import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
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
  GetAllAndSearchDto,
  GetAllAndSearchResponse,
  ICoupon,
  IResponse,
  successResponseHandler,
  User,
} from 'src/common';
import { type HydratedUser } from 'src/db';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CouponParamsDto,
  CreateCouponDto,
  UpdateCouponDto,
} from './dto/coupon.dto';
import {
  CouponResponse,
  UpdateCouponImageResponse,
} from './entities/coupon.entities';

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
  @CombinedAuth({
    accessRoles: couponAuthorizationEndpoints.createAndUpdateCoupon,
  })
  @Post()
  async createCoupon(
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @Body() body: CreateCouponDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<CouponResponse>> {
    const coupon = await this._couponService.createCoupon({ file, body, user });

    return successResponseHandler<CouponResponse>({ data: { coupon } });
  }

  @UseInterceptors(
    FileInterceptor(
      'image',
      cloudFileUploadOptions({ fileValidation: FilesMimeTypes.images }),
    ),
  )
  @CombinedAuth({
    accessRoles: couponAuthorizationEndpoints.createAndUpdateCoupon,
  })
  @Patch(':couponId/image')
  async updateCouponImage(
    @Param() params: CouponParamsDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @User() user: HydratedUser,
  ): Promise<IResponse<UpdateCouponImageResponse>> {
    const image = await this._couponService.updateCouponImage({
      user,
      couponId: params.couponId,
      image: file,
    });

    return successResponseHandler<UpdateCouponImageResponse>({
      data: { image },
    });
  }

  @CombinedAuth({
    accessRoles: couponAuthorizationEndpoints.createAndUpdateCoupon,
  })
  @Patch(':couponId/restore')
  async restoreCoupon(
    @Param() params: CouponParamsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<CouponResponse>> {
    const coupon = await this._couponService.restoreCoupon({
      couponId: params.couponId,
      user,
    });

    return successResponseHandler<CouponResponse>({
      message: 'Coupon restored successfully ✅',
      data: { coupon },
    });
  }

  @CombinedAuth({
    accessRoles: couponAuthorizationEndpoints.createAndUpdateCoupon,
  })
  @Patch(':couponId')
  async updateCoupon(
    @Param() params: CouponParamsDto,
    @Body() body: UpdateCouponDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<CouponResponse>> {
    const coupon = await this._couponService.updateCoupon({
      user,
      couponId: params.couponId,
      body,
    });

    return successResponseHandler<CouponResponse>({ data: { coupon } });
  }

  @CombinedAuth({
    accessRoles: couponAuthorizationEndpoints.createAndUpdateCoupon,
  })
  @Delete(':couponId/freeze')
  async freezeCoupon(
    @Param() params: CouponParamsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse> {
    await this._couponService.freezeCoupon({ couponId: params.couponId, user });

    return successResponseHandler({
      message: 'Coupon freezed successfully ✅',
    });
  }

  @CombinedAuth({
    accessRoles: couponAuthorizationEndpoints.createAndUpdateCoupon,
  })
  @Delete(':couponId')
  async removeCoupon(@Param() params: CouponParamsDto): Promise<IResponse> {
    await this._couponService.removeCoupon({ couponId: params.couponId });

    return successResponseHandler({
      message: 'Coupon removed successfully ✅',
    });
  }

  @Get()
  async findAllCoupons(
    @Query() queryParams: GetAllAndSearchDto,
  ): Promise<IResponse<GetAllAndSearchResponse<ICoupon>>> {
    const result = await this._couponService.findAllCoupons({ queryParams });
    return successResponseHandler<GetAllAndSearchResponse<ICoupon>>({
      data: result,
    });
  }

  @CombinedAuth({
    accessRoles: couponAuthorizationEndpoints.createAndUpdateCoupon,
  })
  @Get('/archives')
  async findAllArchives(
    @Query() queryParams: GetAllAndSearchDto,
  ): Promise<IResponse<GetAllAndSearchResponse<ICoupon>>> {
    const result = await this._couponService.findAllCoupons({
      queryParams,
      archived: true,
    });
    return successResponseHandler<GetAllAndSearchResponse<ICoupon>>({
      data: result,
    });
  }

  @CombinedAuth({
    accessRoles: couponAuthorizationEndpoints.createAndUpdateCoupon,
  })
  @Get(':couponId/archived')
  async findArchivedCoupon(
    @Param() params: CouponParamsDto,
  ): Promise<IResponse<CouponResponse>> {
    return successResponseHandler<CouponResponse>({
      data: {
        coupon: await this._couponService.findOneCoupon({
          couponId: params.couponId,
          archived: true,
        }),
      },
    });
  }

  @Get(':couponId')
  async findCoupon(
    @Param() params: CouponParamsDto,
  ): Promise<IResponse<CouponResponse>> {
    return successResponseHandler<CouponResponse>({
      data: {
        coupon: await this._couponService.findOneCoupon({
          couponId: params.couponId,
        }),
      },
    });
  }
}

export default CouponController;
