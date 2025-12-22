import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Types } from 'mongoose';

@ValidatorConstraint()
class MongoDBIds implements ValidatorConstraintInterface {
  validate(
    ids: Types.ObjectId[],
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    for (const id of ids) {
      if (!Types.ObjectId.isValid(id)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `Some of the mongoDB ids are not valid 🚫`;
  }
}

function AreMongoIds(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: MongoDBIds,
    });
  };
}

export default AreMongoIds;
