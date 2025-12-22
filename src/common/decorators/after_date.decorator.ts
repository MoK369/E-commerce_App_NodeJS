import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
class CheckAfterDate implements ValidatorConstraintInterface {
  validate(
    value: string,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    const inputDate = new Date(value);
    const comparingDate = new Date(
      validationArguments?.object[validationArguments?.constraints[0]] ?? '',
    );
    return inputDate.getTime() > comparingDate.getTime();
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `${validationArguments?.property} is not after the date: ${validationArguments?.object[validationArguments?.constraints[0]]} 🚫`;
  }
}
function IsAfterDate(date: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [date],
      validator: CheckAfterDate,
    });
  };
}

export default IsAfterDate;
