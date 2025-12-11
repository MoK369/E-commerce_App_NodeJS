import {
  Controller,
  Get,
  Headers,
  MaxFileSizeValidator,
  NotFoundException,
  ParseFilePipe,
  Patch,
  Req,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { delay, Observable, of } from 'rxjs';
import { FilesMimeTypes, type IMulterFile, StorageTypesEnum, User } from 'src/common';
import { ApplyAuthentication } from 'src/common/decorators/auths.decorator';
import { PreferedLanguageInterceptor } from 'src/common/interceptors';
import {
  cloudFileUploadOptions,
  localFileUploadOptions,
} from 'src/common/utils/multer';
import type { HydratedUser } from 'src/db';

@Controller('user')
class UserController {
  constructor() {}

  @UseInterceptors(PreferedLanguageInterceptor)
  @ApplyAuthentication()
  @Get()
  profile(
    @Headers() headers: Request['headers'],
    @User() user: HydratedUser,
  ): Observable<any> {
    console.log({ lang: headers['accept-language'] });

    console.log({ credentials: user });

    return of([{ message: 'Done ✅' }]).pipe(delay(12000));
  }

  @UseInterceptors(
    FileInterceptor(
      'profileImage',
      cloudFileUploadOptions({
        storageApproach: StorageTypesEnum.disk,
        fileValidation: FilesMimeTypes.images,
      }),
    ),
  )
  @ApplyAuthentication()
  @Patch('profile-image')
  profileImage(
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
    file: IMulterFile,
  ) {
    return { message: 'Done ✅', file };
  }

  @UseInterceptors(
    FilesInterceptor(
      'coverImages',
      2,
      localFileUploadOptions({
        folder: 'user',
        fileValidation: FilesMimeTypes.images,
      }),
    ),
  )
  @ApplyAuthentication()
  @Patch('cover-images')
  coverImages(
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: true,
        exceptionFactory(error) {
          throw new NotFoundException('Files are required');
        },
        validators: [
          new MaxFileSizeValidator({
            maxSize: 2 * 1024 * 1024,
            message: (maxSize) => `file is to large maxSize is ${maxSize} `,
          }),
        ],
      }),
    )
    files: IMulterFile[],
  ) {
    return { message: 'Done ✅', files };
  }
}

export default UserController;
