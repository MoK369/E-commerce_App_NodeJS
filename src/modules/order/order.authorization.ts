import { UserRolesEnum } from 'src/common';

const orderAuthorizationEndpoint = {
  refund: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};

export default orderAuthorizationEndpoint;
