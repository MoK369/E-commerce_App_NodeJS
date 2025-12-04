import { SetMetadata } from '@nestjs/common';
import { UserRolesEnum } from '../enums';
import { StringConstants } from '../constants';

function SetAccessRoles(roles: UserRolesEnum[]) {
  return SetMetadata(StringConstants.accessRolesName, roles);
}

export default SetAccessRoles;
