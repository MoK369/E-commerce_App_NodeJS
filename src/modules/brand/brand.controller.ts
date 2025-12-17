import {
  Body,
  Controller,
  Param,
  ParseFilePipe,
  Patch,
  Post,
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
  UpdateBrandDto,
} from './dto/brand.dto';
import type { HydratedUser } from 'src/db';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBrandResponse } from './entities/brand.entity';
import { CombinedAuth } from 'src/common/decorators/auths.decorator';
import { authorizationEndpoints } from './brand.authorization';

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
  @CombinedAuth({ accessRoles: authorizationEndpoints.createBrand })
  @Post()
  async createBrand(
    @User() user: HydratedUser,
    @Body() body: CreateBrandDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<CreateBrandResponse>> {
    const brand = await this._brandService.createBrand({ body, file, user });
    return successResponseHandler<CreateBrandResponse>({ data: { brand } });
  }

  @CombinedAuth({ accessRoles: authorizationEndpoints.updateBrand })
  @Patch(':brandId')
  async updateBrand(
    @Param() params: BrandParamsDto,
    @Body() body: UpdateBrandDto,
  ) {
    console.log("inside updateBrand");
    
    return this._brandService.updateBrand({ brandId: params.brandId, body });
  }
}

export default BrandController;
