import { UserRolesEnum } from 'src/common';

export const authorizationEndpoints = {
  createBrand: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};
