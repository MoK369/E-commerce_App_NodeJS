import { Module } from '@nestjs/common';
import AuthenticationController from './auth.controller';
import { AuthenticationService } from './auth.service';
import AuthValidator from './auth.validation';

@Module({
  imports: [],
  exports: [],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
class AuthenticationModule {}

export default AuthenticationModule;
