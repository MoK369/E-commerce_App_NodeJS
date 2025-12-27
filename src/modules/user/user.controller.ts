import {
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  FilesMimeTypes,
  IResponse,
  type ITokenPayload,
  IUser,
  successResponseHandler,
  TokenPayload,
  TokenTypesEnum,
  User,
} from 'src/common';
import {
  ApplyAuthentication,
  CombinedAuth,
} from 'src/common/decorators/auths.decorator';
import { PreferedLanguageInterceptor } from 'src/common/interceptors';
import { cloudFileUploadOptions } from 'src/common/utils/multer';
import type { HydratedUser } from 'src/db';
import UserService from './user.service';
import { ProfileResponse, RefreshTokenResponse } from './entities/user.entity';
import {
  ChangeRoleBodyDto,
  FreezeParamsDto,
  LogoutBodyDto,
  UserParamsDto,
} from './dto/user.dto';
import type { Response } from 'express';
import userAuthorizationEndpoints from './user.authorization';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
@Controller('user')
class UserController {
  constructor(private userService: UserService) {}

  @UseInterceptors(PreferedLanguageInterceptor)
  @ApplyAuthentication()
  @Get()
  async profile(
    @User() profile: HydratedUser,
  ): Promise<IResponse<ProfileResponse>> {
    await profile.populate([{ path: 'wishlist' }]);
    return successResponseHandler<ProfileResponse>({ data: { profile } });
  }

  @ApplyAuthentication()
  @Post('logout')
  async logout(
    @Body() body: LogoutBodyDto,
    @User() user: HydratedUser,
    @TokenPayload() payload: ITokenPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IResponse> {
    const statusCode = await this.userService.logout({ body, user, payload });
    res.status(statusCode);
    return successResponseHandler({ message: 'Logged out Successfully ✅' });
  }

  @ApplyAuthentication(TokenTypesEnum.refresh)
  @Post('refresh-token')
  async refreshToken(
    @User() user: HydratedUser,
    @TokenPayload() payload: ITokenPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IResponse<RefreshTokenResponse>> {
    const { statusCode, ...restObj } = await this.userService.refreshToken({
      user,
      payload,
    });

    res.status(statusCode);

    return successResponseHandler<RefreshTokenResponse>({ data: restObj });
  }

  @UseInterceptors(
    FileInterceptor(
      'profileImage',
      cloudFileUploadOptions({
        fileValidation: FilesMimeTypes.images,
      }),
    ),
  )
  @ApplyAuthentication()
  @Patch('profile-image')
  async profileImage(
    @User() user: HydratedUser,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({
            maxSize: 2 * 1024 * 1024,
            message: (maxSize) => `file is to large maxSize is ${maxSize} `,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<{ message: string; profileImage: IUser['profileImage'] }> {
    const profileImage = await this.userService.profileImage(file, user);
    return { message: 'Done ✅', profileImage };
  }

  @CombinedAuth({ accessRoles: userAuthorizationEndpoints.changeRole })
  @Patch(':userId/change-role')
  async changeRole(
    @Param() params: UserParamsDto,
    @Body() body: ChangeRoleBodyDto,
    @User() user: HydratedUser,
  ) {
    await this.userService.changeRole({ userId: params.userId, body, user });
    return successResponseHandler({ message: 'Role changed successfully ✅' });
  }

  @CombinedAuth({ accessRoles: userAuthorizationEndpoints.changeRole })
  @Patch(':userId/restore-account')
  async restoreAccount(
    @Param() params: UserParamsDto,
    @User() user: HydratedUser,
  ) {
    await this.userService.restoreAccount({ userId: params.userId, user });

    return successResponseHandler({
      message: 'Account Restored Successfully ✅',
    });
  }

  @ApplyAuthentication()
  @Delete('{/:userId}/freeze-account')
  async freezeAcount(
    @Param() params: FreezeParamsDto,
    @User() user: HydratedUser,
  ) {
    await this.userService.freezeAccount({ userId: params?.userId, user });

    return successResponseHandler({
      message: 'Account Freezed Successfully ✅',
    });
  }

  @CombinedAuth({ accessRoles: userAuthorizationEndpoints.changeRole })
  @Delete(':userId/delete-account')
  async deleteAccount(
    @Param() params: UserParamsDto,
  ) {
    await this.userService.hardDeleteAccount({ userId: params.userId });

    return successResponseHandler({
      message: 'Account Deleted Successfully ✅',
    });
  }
  // @UseInterceptors(
  //   FilesInterceptor(
  //     'coverImages',
  //     2,
  //     localFileUploadOptions({
  //       folder: 'user',
  //       fileValidation: FilesMimeTypes.images,
  //     }),
  //   ),
  // )
  // @ApplyAuthentication()
  // @Patch('cover-images')
  // coverImages(
  //   @UploadedFiles(
  //     new ParseFilePipe({
  //       fileIsRequired: true,
  //       exceptionFactory(error) {
  //         throw new NotFoundException('Files are required');
  //       },
  //       validators: [
  //         new MaxFileSizeValidator({
  //           maxSize: 2 * 1024 * 1024,
  //           message: (maxSize) => `file is to large maxSize is ${maxSize} `,
  //         }),
  //       ],
  //     }),
  //   )
  //   files: IMulterFile[],
  // ) {
  //   return { message: 'Done ✅', files };
  // }
}

export default UserController;
