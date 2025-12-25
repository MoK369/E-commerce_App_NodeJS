import { UserRolesEnum } from 'src/common';

const couponAuthorizationEndpoints = {
  createAndUpdateCoupon: [UserRolesEnum.admin, UserRolesEnum.superAdmin],
};

export default couponAuthorizationEndpoints;
