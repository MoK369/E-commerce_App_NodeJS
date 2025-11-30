import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Redirect,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticationService } from './auth.service';
import SignUpBodyDto from './dto/sign_up.dto';

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
  signUp(
    @Body()
    body: SignUpBodyDto,
  ) {
    console.log({ body });

    const id = this.authenticationService.signUp(body);
    return { message: 'Done', body: { userId: id } };
  }

  @HttpCode(HttpStatus.OK) //@HttpCode(200)
  @Post('log-in')
  logIn() {
    return 'Log In';
  }
}

export default AuthenticationController;
