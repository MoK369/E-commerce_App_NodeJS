import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
class CheckFutureDate implements ValidatorConstraintInterface {
  validate(
    value: string,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    const date = new Date(value);
    const now = new Date();

    return (
      date.getTime() >= new Date(now.toLocaleDateString().split('T')[0]).getTime()
    );
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `${validationArguments?.property} must be current or future date 🚫`;
  }
}
function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: CheckFutureDate,
    });
  };
}

export default IsFutureDate;
