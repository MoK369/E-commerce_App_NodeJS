import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
class CustomValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}
  async transform(value: any, metadata: ArgumentMetadata) {
    const { error, success } = await this.schema.safeParseAsync(value);
    if (!success) {
      throw new BadRequestException({
        message: 'Validation Error',
        details: error.issues.map((issue) => {
          return {
            code: issue.code,
            path: issue.path.join('.'),
            message: issue.message,
          };
        }),
      });
    }
    return value;
  }
}

export default CustomValidationPipe;
