import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CouponRepository } from 'src/db';

@ValidatorConstraint({ name: 'IsAfterDate', async: true })
export class CheckAfterDate implements ValidatorConstraintInterface {
  constructor(private readonly _couponRepository: CouponRepository) {}

  async validate(
    value: string,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> {
    const inputDate = new Date(value);
    let comparingDate: Date;

    if (!validationArguments?.object[validationArguments?.constraints[0]]) {
      const coupon = await this._couponRepository.findById({
        id: (validationArguments?.object as any).requestContext.id,
      });
      if (!coupon) return true;

      comparingDate = new Date(coupon.startDate);
    } else {
      comparingDate = new Date(
        validationArguments.object[validationArguments.constraints[0]],
      );
    }

    return inputDate.getTime() > comparingDate.getTime();
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `${validationArguments?.property} is not after the ${validationArguments?.constraints[0]} 🚫`;
  }
}
export function IsAfterDate(
  dateField: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [dateField],
      validator: CheckAfterDate,
    });
  };
}
