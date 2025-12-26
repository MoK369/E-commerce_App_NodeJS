import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticationService } from './auth.service';
import {
  ConfirmEmailBodyDto,
  ForgetPasswordDto,
  GmailAuthDto,
  LoginBodyDto,
  ResendConfirmEmailBodyDto,
  ResetForgetPasswordDto,
  SignUpBodyDto,
  VerifyForgetPasswordDto,
} from './dto/auth.dto';
import { IResponse, successResponseHandler } from 'src/common';
import { LoginResponse } from './entities/auth.entity';
import { type Response } from 'express';

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

  @Post('sign-up-with-gmail')
  async signUpWithGmail(
    @Body()
    body: GmailAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IResponse<LoginResponse>> {
    const { statusCode, ...restObj } =
      await this.authenticationService.signUpWithGmail(body);
    res.status(statusCode);
    return successResponseHandler<LoginResponse>({
      message: 'Signed up Successfully ✅',
      data: restObj,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('log-in-with-gmail')
  async logInWithGmail(
    @Body()
    body: GmailAuthDto,
  ): Promise<IResponse<LoginResponse>> {
    return successResponseHandler<LoginResponse>({
      message: 'Logged in Successfully ✅',
      data: await this.authenticationService.logInWithGmail(body),
    });
  }

  @Post('forget-password')
  async forgetPassword(
    @Body() body: ForgetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const status = await this.authenticationService.forgetPassword(body);
    res.status(status);
    return successResponseHandler({
      message: 'Forget Password OTP has been sent to your email ✅',
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-forget-password')
  async verifyForgetPassword(@Body() body: VerifyForgetPasswordDto) {
    await this.authenticationService.verifyForgetPassword(body);
    return successResponseHandler({
      message: 'Forget Password OTP has Verified ✅',
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-forget-password')
  async resetForgetPassword(@Body() body: ResetForgetPasswordDto) {
    await this.authenticationService.resetForgetPassword(body);
    return successResponseHandler({
      message: 'Password has been resetted ✅',
    });
  }
}

export default AuthenticationController;
