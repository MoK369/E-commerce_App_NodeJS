import { UserRolesEnum } from 'src/common';

const userAuthorizationEndpoints = {
  changeRole: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};

export default userAuthorizationEndpoints;
