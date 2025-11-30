import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsCI', async: false })
export class IsCiConstraint implements ValidatorConstraintInterface {
  validate(ci: string, args: ValidationArguments) {
    // Extraer partes de la fecha (YYMMDD)
    const yy = ci.substring(0, 2);
    const mm = ci.substring(2, 4);
    const dd = ci.substring(4, 6);

    // Convertir a números
    const year = 1900 + parseInt(yy, 10);
    const month = parseInt(mm, 10) - 1;
    const day = parseInt(dd, 10);

    // Validar fecha
    const date = new Date(year, month, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'El Carnet de Identidad (CI) no es válido';
  }
}
