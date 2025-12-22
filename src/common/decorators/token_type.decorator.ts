import { SetMetadata } from '@nestjs/common';
import { TokenTypesEnum } from '../enums';
import { StringConstants } from '../constants';

function SetTokenType(type: TokenTypesEnum) {
  return SetMetadata(StringConstants.tokenTypeName, type);
}

export default SetTokenType;
