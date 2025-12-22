import { UserRolesEnum } from 'src/common';

const couponAuthorizationEndpoints = {
  createCoupon: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};

export default couponAuthorizationEndpoints;
