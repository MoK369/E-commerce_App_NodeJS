import { Controller, Get, Req } from '@nestjs/common';
import { TokenTypesEnum, UserRolesEnum, type IAuthRequest } from 'src/common';
import { ApplyAuthentication, CombinedAuth } from 'src/common/decorators/auths.decorator';

@Controller('user')
class UserController {
  constructor() {}

  @CombinedAuth(TokenTypesEnum.refresh,[UserRolesEnum.user])
  @Get()
  profile(@Req() request: IAuthRequest) {
    console.log({ lang: request.headers['accept-language'] });

    console.log({ credentials: request.credentials });

    return { message: 'Done ✅' };
  }
}

export default UserController;
