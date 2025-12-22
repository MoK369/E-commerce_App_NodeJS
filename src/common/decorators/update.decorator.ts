import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'check_fields_exists', async: false })
class CheckIfAnyFieldsAreApplied implements ValidatorConstraintInterface {
  validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    return (
      Object.keys(validationArguments?.object || {}).length > 0 &&
      Object.values(validationArguments?.object || {}).filter(
        (value) => value != undefined,
      ).length > 0
    );
  }
  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `All updated fields are empty ❌`;
  }
}

function ContainField(validationOptions?: ValidationOptions) {
  return function (constructor: Function) {
    registerDecorator({
      target: constructor,
      propertyName: undefined!,
      options: validationOptions,
      constraints: [],
      validator: CheckIfAnyFieldsAreApplied,
    });
  };
}

export default ContainField;
