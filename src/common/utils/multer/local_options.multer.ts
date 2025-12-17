import { diskStorage } from 'multer';
import { IdService } from '../security';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import type { IMulterFile } from 'src/common/';
import { BadRequestException } from '@nestjs/common';

export const localFileUploadOptions = ({
  folder = 'general',
  fileValidation,
  /** In MB */
  fileSize = 2,
}: {
  folder?: string;
  fileValidation: string[];
  fileSize?: number;
}): MulterOptions => {
  const basePath = `/uploads/${folder}`;

  return {
    storage: diskStorage({
      destination(req, file, callback) {
        const fullPath = path.resolve(`./${basePath}`);
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true });
        }
        callback(null, fullPath);
      },
      filename(req, file: IMulterFile, callback) {
        const idService = new IdService();
        const fileName = `${idService.generateAlphaNumaricId()}_${file.originalname}`;
        file.finalPath = `${basePath}/${fileName}`;
        callback(null, fileName);
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
