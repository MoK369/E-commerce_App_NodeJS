import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { asyncPipeline, S3Service } from './common';
import type { Response } from 'express';

type GetFileQueryParamsType = {
  download?: string;
  downloadName?: string;
};

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private _s3Service: S3Service,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/presignd-url/*path')
  async getPresignedAssetUrl(
    @Query() query: GetFileQueryParamsType,
    @Param() params: { path: string[] },
  ) {
    const { download, downloadName } = query;
    const { path } = params;
    const SubKey = path.join('/');

    const signedUrl = await this._s3Service.createPresignedGetUrl({
      SubKey,
      download,
      downloadName,
    });

    return {
      message: 'Presigned URL Generated !',
      body: { url: signedUrl },
    };
  }
  @Get('uploads/*path')
  async getUploads(
    @Query() query: GetFileQueryParamsType,
    @Param() params: { path: string[] },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { download, downloadName } = query;
    const { path } = params;
    const SubKey = path.join('/');

    const s3Response = await this._s3Service.getFile({ SubKey });
    if (!s3Response?.Body) {
      throw new BadRequestException('Failed to fetch this asset ☹️');
    }

    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader(
      'Content-Type',
      s3Response.ContentType || 'application/octet-stream',
    );
    if (download === 'true') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${
          downloadName
            ? `${downloadName}.${s3Response.ContentType?.split('/')[1]}`
            : SubKey.split('/').pop()
        }"`,
      );
    }
    return asyncPipeline({
      source: s3Response.Body as NodeJS.ReadableStream,
      destination: res,
    });
  }
}
