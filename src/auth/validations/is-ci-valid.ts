import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsCiConstraint } from './is-ci-valid.constraint';

export function IsCI(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCiConstraint,
    });
  };
}
