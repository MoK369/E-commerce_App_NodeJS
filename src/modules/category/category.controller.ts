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
import { FileInterceptor } from '@nestjs/platform-express';
import {
  cloudFileUploadOptions,
  FilesMimeTypes,
  GetAllAndSearchDto,
  GetAllAndSearchResponse,
  ICategory,
  IResponse,
  successResponseHandler,
  User,
} from 'src/common';
import CategoryService from './category.service';
import { CombinedAuth } from 'src/common/decorators/auths.decorator';
import { categoryAuthorizationEndpoints } from './category.authorization';
import { type HydratedUser } from 'src/db';
import {
  CategoryParamsDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';
import {
  CategoryResponse,
  UpdateCategoryImageResponse,
} from './entities/category.entities';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('category')
class CategoryController {
  constructor(private readonly _categoryService: CategoryService) {}

  @UseInterceptors(
    FileInterceptor(
      'image',
      cloudFileUploadOptions({ fileValidation: FilesMimeTypes.images }),
    ),
  )
  @CombinedAuth({
    accessRoles: categoryAuthorizationEndpoints.createAndUpdateCategory,
  })
  @Post()
  async createCategory(
    @User() user: HydratedUser,
    @Body() body: CreateCategoryDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<CategoryResponse>> {
    const category = await this._categoryService.createCategory({
      body,
      file,
      user,
    });
    return successResponseHandler<CategoryResponse>({ data: { category } });
  }

  @UseInterceptors(
    FileInterceptor(
      'image',
      cloudFileUploadOptions({ fileValidation: FilesMimeTypes.images }),
    ),
  )
  @CombinedAuth({
    accessRoles: categoryAuthorizationEndpoints.createAndUpdateCategory,
  })
  @Patch(':categoryId/image')
  async updateCategoryImage(
    @Param() params: CategoryParamsDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @User() user: HydratedUser,
  ): Promise<IResponse<UpdateCategoryImageResponse>> {
    const image = await this._categoryService.updateCategoryImage({
      user,
      categoryId: params.categoryId,
      image: file,
    });

    return successResponseHandler<UpdateCategoryImageResponse>({
      data: { image },
    });
  }

  @CombinedAuth({
    accessRoles: categoryAuthorizationEndpoints.createAndUpdateCategory,
  })
  @Patch(':categoryId/restore')
  async restoreCategory(
    @Param() params: CategoryParamsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<CategoryResponse>> {
    const category = await this._categoryService.restoreCategory({
      categoryId: params.categoryId,
      user,
    });

    return successResponseHandler<CategoryResponse>({
      message: 'Category restored successfully ✅',
      data: { category },
    });
  }

  @CombinedAuth({
    accessRoles: categoryAuthorizationEndpoints.createAndUpdateCategory,
  })
  @Patch(':categoryId')
  async updateCategory(
    @Param() params: CategoryParamsDto,
    @Body() body: UpdateCategoryDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<CategoryResponse>> {
    const category = await this._categoryService.updateCategory({
      user,
      categoryId: params.categoryId,
      body,
    });

    return successResponseHandler<CategoryResponse>({ data: { category } });
  }

  @CombinedAuth({
    accessRoles: categoryAuthorizationEndpoints.createAndUpdateCategory,
  })
  @Delete(':categoryId/freeze')
  async freezeCategory(
    @Param() params: CategoryParamsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse> {
    await this._categoryService.freezeCategory({
      categoryId: params.categoryId,
      user,
    });

    return successResponseHandler({ message: 'Category freezed successfully ✅' });
  }

  @CombinedAuth({
    accessRoles: categoryAuthorizationEndpoints.createAndUpdateCategory,
  })
  @Delete(':categoryId')
  async removeCategory(@Param() params: CategoryParamsDto): Promise<IResponse> {
    await this._categoryService.removeCategory({
      categoryId: params.categoryId,
    });

    return successResponseHandler({ message: 'Category removed successfully ✅' });
  }

  @Get()
  async findAllCategories(
    @Query() queryParams: GetAllAndSearchDto,
  ): Promise<IResponse<GetAllAndSearchResponse<ICategory>>> {
    const result = await this._categoryService.findAllCategories({
      queryParams,
    });
    return successResponseHandler<GetAllAndSearchResponse<ICategory>>({ data: result });
  }

  @CombinedAuth({
    accessRoles: categoryAuthorizationEndpoints.createAndUpdateCategory,
  })
  @Get('/archives')
  async findAllArchives(
    @Query() queryParams: GetAllAndSearchDto,
  ): Promise<IResponse<GetAllAndSearchResponse<ICategory>>> {
    const result = await this._categoryService.findAllCategories({
      queryParams,
      archived: true,
    });
    return successResponseHandler<GetAllAndSearchResponse<ICategory>>({ data: result });
  }

  @CombinedAuth({
    accessRoles: categoryAuthorizationEndpoints.createAndUpdateCategory,
  })
  @Get(':categoryId/archived')
  async findArchivedCategory(
    @Param() params: CategoryParamsDto,
  ): Promise<IResponse<CategoryResponse>> {
    return successResponseHandler<CategoryResponse>({
      data: {
        category: await this._categoryService.findOneCategory({
          categoryId: params.categoryId,
          archived: true,
        }),
      },
    });
  }

  @Get(':categoryId')
  async findCategory(
    @Param() params: CategoryParamsDto,
  ): Promise<IResponse<CategoryResponse>> {
    return successResponseHandler<CategoryResponse>({
      data: {
        category: await this._categoryService.findOneCategory({
          categoryId: params.categoryId,
        }),
      },
    });
  }
}

export default CategoryController;
