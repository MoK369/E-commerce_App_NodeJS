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
import { IResponse, successResponseHandler } from 'src/common';
import { LoginResponse } from './entities/auth.entity';

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
  ): Promise<IResponse> {
    await this.authenticationService.signUp(body);
    return successResponseHandler({ message: 'Signed up Successfully ✅' });
  }

  @Post('resend-confirm-email')
  async resendConfirmEmail(
    @Body()
    body: ResendConfirmEmailBodyDto,
  ): Promise<IResponse> {
    await this.authenticationService.resendConfirmEmail(body);
    return successResponseHandler({ message: 'OTP has been resend ✅' });
  }

  @Patch('confirm-email')
  async confirmEmail(
    @Body()
    body: ConfirmEmailBodyDto,
  ): Promise<IResponse> {
    await this.authenticationService.confirmEmail(body);
    return successResponseHandler({ message: 'Email has been confirmed ✅' });
  }

  @HttpCode(HttpStatus.OK) //@HttpCode(200)
  @Post('log-in')
  async logIn(@Body() body: LoginBodyDto): Promise<IResponse<LoginResponse>> {
    const data = await this.authenticationService.logIn(body);
    return successResponseHandler<LoginResponse>({
      message: 'Logged In Successfully ✅',
      data,
    });
  }
}

export default AuthenticationController;
