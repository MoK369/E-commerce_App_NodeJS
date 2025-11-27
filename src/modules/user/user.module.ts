import { Module } from '@nestjs/common';
import UserController from './user.controller';
import UserService from './user.service';

@Module({
  imports: [],
  exports: [],
  controllers: [UserController],
  providers: [UserService],
})
class UserModule {}

export default UserModule;
