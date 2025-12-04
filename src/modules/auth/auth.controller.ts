import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticationService } from './auth.service';
import {
  ConfirmEmailBodyDto,
  LoginBodyDto,
  ResendConfirmEmailBodyDto,
  SignUpBodyDto,
} from './dto/auth.dto';
import { HydratedUser } from 'src/db';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('auth')
class AuthenticationController {
  constructor(private authenticationService: AuthenticationService) {}

  @Post('sign-up')
  async signUp(
    @Body()
    body: SignUpBodyDto,
  ): Promise<{ message: string }> {
    const message = await this.authenticationService.signUp(body);
    return { message };
  }

  @Post('resend-confirm-email')
  async resendConfirmEmail(
    @Body()
    body: ResendConfirmEmailBodyDto,
  ): Promise<{ message: string }> {
    const message = await this.authenticationService.resendConfirmEmail(body);
    return { message };
  }

  @Patch('confirm-email')
  async confirmEmail(
    @Body()
    body: ConfirmEmailBodyDto,
  ): Promise<{ message: string }> {
    const message = await this.authenticationService.confirmEmail(body);
    return { message };
  }

  @HttpCode(HttpStatus.OK) //@HttpCode(200)
  @Post('log-in')
  async logIn(@Body() body: LoginBodyDto): Promise<{
    message: string;
    body: { accessToken: string; refreshToken: string; user: HydratedUser };
  }> {
    const data = await this.authenticationService.logIn(body);
    return { message: 'Logged In Successfully ✅', body: { ...data } };
  }
}

export default AuthenticationController;
