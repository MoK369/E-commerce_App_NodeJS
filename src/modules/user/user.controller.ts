import {
  Controller,
  Get,
  Headers,
  MaxFileSizeValidator,
  NotFoundException,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import {
  FilesMimeTypes,
  type IMulterFile,
  IResponse,
  IUser,
  successResponseHandler,
  User,
} from 'src/common';
import { ApplyAuthentication } from 'src/common/decorators/auths.decorator';
import { PreferedLanguageInterceptor } from 'src/common/interceptors';
import {
  cloudFileUploadOptions,
  localFileUploadOptions,
} from 'src/common/utils/multer';
import type { HydratedUser } from 'src/db';
import UserService from './user.service';
import { ProfileResponse } from './entities/user.entity';

@Controller('user')
class UserController {
  constructor(private userService: UserService) {}

  @UseInterceptors(PreferedLanguageInterceptor)
  @ApplyAuthentication()
  @Get()
  async profile(
    @Headers() headers: Request['headers'],
    @User() profile: HydratedUser,
  ): Promise<IResponse<ProfileResponse>> {
    console.log({ lang: headers['accept-language'] });

    return successResponseHandler<ProfileResponse>({ data: { profile } });
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
