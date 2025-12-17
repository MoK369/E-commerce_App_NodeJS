import { Injectable } from '@nestjs/common';
import { customAlphabet, nanoid } from 'nanoid';

@Injectable()
class IdService {
  generateNumericId = ({ size = 6 }: { size?: number } = {}): string => {
    return customAlphabet('0123456789', size)();
  };

  generateAlphaNumaricId = ({ size = 21 }: { size?: number } = {}): string => {
    return nanoid(size);
  };
}

export default IdService;
