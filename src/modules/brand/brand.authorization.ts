import { UserRolesEnum } from 'src/common';

export const brandAuthorizationEndpoints = {
  createAndUpdateBrand: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};
