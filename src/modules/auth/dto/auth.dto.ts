import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { AppRegex, IsMatch } from 'src/common';

export class ResendConfirmEmailBodyDto {
  @IsEmail()
  email: string;
}

export class LoginBodyDto extends ResendConfirmEmailBodyDto {
  @IsStrongPassword({ minLength: 8, minUppercase: 1, minSymbols: 1 })
  password: string;
}

export class SignUpBodyDto extends LoginBodyDto {
  @Length(2, 30, { message: 'username charachters length is 2-30' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsMatch<boolean>(['password'])
  @ValidateIf((data: SignUpBodyDto) => {
    return Boolean(data.password);
  })
  confirmPassword: string;
}

export class GmailAuthDto {
  @Matches(AppRegex.tokenRegex, { message: 'Invalid token format' })
  @IsNotEmpty()
  @IsString()
  idToken: string;
}

export class ConfirmEmailBodyDto extends ResendConfirmEmailBodyDto {
  @Matches(AppRegex.otpRegex)
  otp: string;
}

export class ForgetPasswordDto {
  @IsEmail()
  email: string;
}

export class VerifyForgetPasswordDto extends ForgetPasswordDto {
  @Matches(AppRegex.otpRegex, { message: 'OTP must consist of 6 digits 🚫' })
  @IsString()
  otpCode: string;
}

export class ResetForgetPasswordDto extends ForgetPasswordDto {
  @Matches(AppRegex.passwordRegex, { message: 'Password is week' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @IsMatch(['password'])
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
