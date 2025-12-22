import { Module } from '@nestjs/common';
import AuthenticationController from './auth.controller';
import { AuthenticationService } from './auth.service';
import { OtpModel } from 'src/db';
import OtpRepository from 'src/db/repositories/otp.repository';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports: [SharedAuthenticationModule, OtpModel],
  exports: [],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, OtpRepository],
})
class AuthenticationModule {}

export default AuthenticationModule;
