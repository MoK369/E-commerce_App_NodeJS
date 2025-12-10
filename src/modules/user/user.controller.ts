import { Controller, Get, Headers, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { delay, Observable, of } from 'rxjs';
import { User } from 'src/common';
import { ApplyAuthentication } from 'src/common/decorators/auths.decorator';
import { PreferedLanguageInterceptor } from 'src/common/interceptors';
import type { HydratedUser } from 'src/db';

@Controller('user')
class UserController {
  constructor() {}

  @UseInterceptors(PreferedLanguageInterceptor)
  @ApplyAuthentication()
  @Get()
  profile(
    @Headers() headers: Request['headers'],
    @User() user: HydratedUser,
  ): Observable<any> {
    console.log({ lang: headers['accept-language'] });

    console.log({ credentials: user });

    return of([{ message: 'Done ✅' }]).pipe(delay(12000));
  }
}

export default UserController;
