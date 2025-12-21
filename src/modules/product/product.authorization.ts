import { UserRolesEnum } from 'src/common';

const productAuthorizationEndpoints = {
  createAndUpdateProduct: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};

export default productAuthorizationEndpoints;
