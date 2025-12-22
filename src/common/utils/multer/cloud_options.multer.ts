import { diskStorage, memoryStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import { StorageTypesEnum as StorageTypesEnum } from 'src/common/enums';
import { access, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { IdService } from '../security';

export const cloudFileUploadOptions = ({
  storageApproach = StorageTypesEnum.memory,
  fileValidation,
  /** In MB */
  fileSize = 2,
}: {
  storageApproach?: StorageTypesEnum;
  fileValidation: string[];
  fileSize?: number;
}): MulterOptions => {
  const _tempFolderPath = './Temp';

  return {
    storage:
      storageApproach === StorageTypesEnum.memory
        ? memoryStorage()
        : diskStorage({
            destination: async function (req, file, callback) {
              await access(resolve(_tempFolderPath)).catch(async (error) => {
                if (error.code == 'ENOENT') {
                  await mkdir(resolve(_tempFolderPath), {
                    recursive: true,
                  });
                }
              }); // ensure that the /tmp folder exists
              return callback(null, _tempFolderPath); // files will be uploaded to /tmp folder first before being uploaded to cloudinary
            },
            filename: function (req, file, callback) {
              const idService = new IdService();
              callback(
                null,
                `${idService.generateAlphaNumaricId({ size: 21 })}_${file.originalname}`,
              );
            },
          }),

    fileFilter(req, file, callback) {
      if (!fileValidation.includes(file.mimetype)) {
        return callback(new BadRequestException('Invalid File Format '), false);
      }
      return callback(null, true);
    },

    limits: {
      fileSize: fileSize * 1024 * 1024,
    },
  };
};
