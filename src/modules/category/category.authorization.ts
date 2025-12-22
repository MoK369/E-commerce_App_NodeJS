import { UserRolesEnum } from 'src/common';

export const categoryAuthorizationEndpoints = {
  createAndUpdateCategory: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};
