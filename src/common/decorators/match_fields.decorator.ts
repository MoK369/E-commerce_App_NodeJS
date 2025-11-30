import {
    registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
class MatchBetweenFields<T=any> implements ValidatorConstraintInterface {
  validate(
    value: T,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {

    return (
      value === validationArguments?.object[validationArguments.constraints[0]]
    );
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `${validationArguments?.property} mismatches ${validationArguments?.constraints[0]} 🚫`;
  }
}
 function IsMatch<T=any>(
  constraints: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints,
      validator: MatchBetweenFields<T>,
    });
  };
}

export default IsMatch
