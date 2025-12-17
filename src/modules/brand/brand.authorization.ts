import { UserRolesEnum } from 'src/common';

export const authorizationEndpoints = {
  createBrand: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
  updateBrand: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};
