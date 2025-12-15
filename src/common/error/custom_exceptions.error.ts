import { HttpException } from '@nestjs/common';

export class S3Exception extends HttpException {
  constructor(
    awsS3Error: any | undefined,
    message: string,
  ) {
    super(
      {
        code: awsS3Error?.Code,
        message:
          message +
          (awsS3Error?.message ? ` (Exact Error: ${awsS3Error.message})` : ''),
      },
      awsS3Error?.$metadata.httpStatusCode || 400,
    );
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
