import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
  ValidateIf,
} from 'class-validator';
import { IsMatch } from 'src/common';

class SignUpBodyDto {
  @Length(2, 30, { message: 'username charachters length is 2-30' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsStrongPassword({ minLength: 8, minUppercase: 1, minSymbols: 1 })
  password: string;

  @IsMatch<boolean>(['password'])
  @ValidateIf((data: SignUpBodyDto) => {
    return Boolean(data.password);
  })
  confirmPassword: string;
}

export default SignUpBodyDto;
