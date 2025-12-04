import { applyDecorators, UseGuards } from '@nestjs/common';
import { TokenTypesEnum, UserRolesEnum } from '../enums';
import SetTokenType from './token_type.decorator';
import SetAccessRoles from './set_access_roles.decorator';
import AuthenticationGuard from '../guards/authentication.guard';
import AuthorizationGuard from '../guards/authorization.guard';

export function ApplyAuthentication(
  tokenType: TokenTypesEnum = TokenTypesEnum.access,
) {
  return applyDecorators(
    SetTokenType(tokenType),
    UseGuards(AuthenticationGuard),
  );
}

export function ApplyAuthorization(accessRoles: UserRolesEnum[] = []) {
  return applyDecorators(
    SetAccessRoles(accessRoles),
    UseGuards(AuthorizationGuard),
  );
}

export function CombinedAuth(
  tokenType: TokenTypesEnum = TokenTypesEnum.access,
  accessRoles: UserRolesEnum[] = [],
) {
  return applyDecorators(
    SetTokenType(tokenType),
    SetAccessRoles(accessRoles),
    UseGuards(AuthenticationGuard, AuthorizationGuard),
  );
}
