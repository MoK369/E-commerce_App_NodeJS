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
import BrandService from './brand.service';
import {
  cloudFileUploadOptions,
  FilesMimeTypes,
  IResponse,
  successResponseHandler,
  User,
} from 'src/common';
import {
  BrandParamsDto,
  CreateBrandDto,
  GetAllBrandsDto,
  UpdateBrandDto,
} from './dto/brand.dto';
import type { HydratedUser } from 'src/db';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  BrandResponse,
  FindAllBrandsResponse,
  UpdateBrandImageResponse,
} from './entities/brand.entity';
import { CombinedAuth } from 'src/common/decorators/auths.decorator';
import { brandAuthorizationEndpoints } from './brand.authorization';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('brand')
class BrandController {
  constructor(private readonly _brandService: BrandService) {}

  @UseInterceptors(
    FileInterceptor(
      'image',
      cloudFileUploadOptions({ fileValidation: FilesMimeTypes.images }),
    ),
  )
  @CombinedAuth({ accessRoles: brandAuthorizationEndpoints.createAndUpdateBrand })
  @Post()
  async createBrand(
    @User() user: HydratedUser,
    @Body() body: CreateBrandDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<BrandResponse>> {
    const brand = await this._brandService.createBrand({ body, file, user });
    return successResponseHandler<BrandResponse>({ data: { brand } });
  }

  @UseInterceptors(
    FileInterceptor(
      'image',
      cloudFileUploadOptions({ fileValidation: FilesMimeTypes.images }),
    ),
  )
  @CombinedAuth({ accessRoles: brandAuthorizationEndpoints.createAndUpdateBrand })
  @Patch(':brandId/image')
  async updateBrandImage(
    @Param() params: BrandParamsDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @User() user: HydratedUser,
  ): Promise<IResponse<UpdateBrandImageResponse>> {
    const image = await this._brandService.updateBrandImage({
      user,
      brandId: params.brandId,
      image: file,
    });

    return successResponseHandler<UpdateBrandImageResponse>({
      data: { image },
    });
  }

  @CombinedAuth({ accessRoles: brandAuthorizationEndpoints.createAndUpdateBrand })
  @Patch(':brandId/restore')
  async restoreBrand(
    @Param() params: BrandParamsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<BrandResponse>> {
    const brand = await this._brandService.restoreBrand({
      brandId: params.brandId,
      user,
    });

    return successResponseHandler<BrandResponse>({
      message: 'Brand restored successfully ✅',
      data: { brand },
    });
  }

  @CombinedAuth({ accessRoles: brandAuthorizationEndpoints.createAndUpdateBrand })
  @Patch(':brandId')
  async updateBrand(
    @Param() params: BrandParamsDto,
    @Body() body: UpdateBrandDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<BrandResponse>> {
    const brand = await this._brandService.updateBrand({
      user,
      brandId: params.brandId,
      body,
    });

    return successResponseHandler<BrandResponse>({ data: { brand } });
  }

  @CombinedAuth({ accessRoles: brandAuthorizationEndpoints.createAndUpdateBrand })
  @Delete(':brandId/freeze')
  async freezeBrand(
    @Param() params: BrandParamsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse> {
    await this._brandService.freezeBrand({ brandId: params.brandId, user });

    return successResponseHandler({ message: 'Brand freezed successfully ✅' });
  }

  @CombinedAuth({ accessRoles: brandAuthorizationEndpoints.createAndUpdateBrand })
  @Delete(':brandId')
  async removeBrand(@Param() params: BrandParamsDto): Promise<IResponse> {
    await this._brandService.removeBrand({ brandId: params.brandId });

    return successResponseHandler({ message: 'Brand removed successfully ✅' });
  }

  @Get()
  async findAllBrands(
    @Query() queryParams: GetAllBrandsDto,
  ): Promise<IResponse<FindAllBrandsResponse>> {
    const result = await this._brandService.findAllBrands({ queryParams });
    return successResponseHandler<FindAllBrandsResponse>({ data: result });
  }

  @CombinedAuth({ accessRoles: brandAuthorizationEndpoints.createAndUpdateBrand })
  @Get('/archives')
  async findAllArchives(
    @Query() queryParams: GetAllBrandsDto,
  ): Promise<IResponse<FindAllBrandsResponse>> {
    const result = await this._brandService.findAllBrands({
      queryParams,
      archived: true,
    });
    return successResponseHandler<FindAllBrandsResponse>({ data: result });
  }

  @CombinedAuth({ accessRoles: brandAuthorizationEndpoints.createAndUpdateBrand })
  @Get(':brandId/archived')
  async findArchivedBrand(
    @Param() params: BrandParamsDto,
  ): Promise<IResponse<BrandResponse>> {
    return successResponseHandler<BrandResponse>({
      data: {
        brand: await this._brandService.findOneBrand({
          brandId: params.brandId,
          archived: true,
        }),
      },
    });
  }

  @Get(':brandId')
  async findBrand(
    @Param() params: BrandParamsDto,
  ): Promise<IResponse<BrandResponse>> {
    return successResponseHandler<BrandResponse>({
      data: {
        brand: await this._brandService.findOneBrand({
          brandId: params.brandId,
        }),
      },
    });
  }
}

export default BrandController;
