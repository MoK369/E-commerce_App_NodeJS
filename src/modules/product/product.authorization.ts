import { UserRolesEnum } from 'src/common';

const productAuthorizationEndpoints = {
  createProduct: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};

export default productAuthorizationEndpoints;
