import { Injectable } from '@nestjs/common';
import { IdService } from '../security';

@Injectable()
class S3KeyService {
  constructor(private _idServcie: IdService) {}

  generateS3Key = ({
    Path,
    tag,
    originalname,
  }: {
    Path: string;
    tag?: string | undefined;
    originalname: string;
  }): string => {
    return `${process.env.APP_NAME}/${Path}/${this._idServcie.generateAlphaNumaricId(
      {
        size: 24,
      },
    )}${tag ? `_${tag}` : ''}_${originalname}`;
  };

  generateS3KeyFromSubKey = (subKey: string): string => {
    return `${process.env.APP_NAME}/${subKey}`;
  };

  generateS3SubKey = ({
    Path,
    tag,
    originalname,
  }: {
    Path: string;
    tag?: string | undefined;
    originalname: string;
  }): string => {
    return `${Path}/${this._idServcie.generateAlphaNumaricId({
      size: 24,
    })}${tag ? `_${tag}` : ''}_${originalname}`;
  };

  generateS3UploadsUrlFromSubKey = ({
    req,
    subKey,
  }: {
    req: { host: string; protocol: string };
    subKey: string;
  }): string => {
    console.log({req});
    
    return `${req.protocol}://${req.host}/uploads/${subKey}`;
  };
}

export default S3KeyService;
