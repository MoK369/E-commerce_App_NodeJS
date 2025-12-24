import { Injectable, Scope } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@Injectable({ scope: Scope.REQUEST })
@ValidatorConstraint({ name: 'CheckAfterDate', async: true })
export class CheckAfterDate implements ValidatorConstraintInterface {
  constructor(
  
  ) {}

  async validate(
    value: string,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> {
    const inputDate = new Date(value);
    const comparingDate = new Date(
      validationArguments?.object[validationArguments?.constraints[0]] ?? '',
    );

    console.log({ object: validationArguments?.object });

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
