import { UserRolesEnum } from 'src/common';

export const authorizationEndpoints = {
  createAndUpdateBrand: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};
