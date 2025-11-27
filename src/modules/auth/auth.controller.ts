import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Redirect,
} from '@nestjs/common';
import { AuthenticationService } from './auth.service';
import SignUpBodyDto from './dto/sign_up.dto';
import CustomValidationPipe from 'src/common/pipes/validation_custom.pipe';
import AuthValidator from './auth.validation';

@Controller('auth')
class AuthenticationController {
  constructor(
    private authenticationService: AuthenticationService,
  ) {}
  @Post('sign-up')
  signUp(
    @Body(new CustomValidationPipe(AuthValidator.signUp)) body: SignUpBodyDto,
  ) {
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
