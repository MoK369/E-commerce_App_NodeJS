import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { LogoutStatusEnum, UserRolesEnum } from 'src/common';

export class LogoutBodyDto {
  @IsEnum(LogoutStatusEnum)
  @IsOptional()
  flag: LogoutStatusEnum = LogoutStatusEnum.one;
}

export class UserParamsDto {
  @IsMongoId()
  userId: Types.ObjectId;
}

export class FreezeParamsDto {
  @IsMongoId()
  @IsOptional()
  userId: Types.ObjectId;
}

export class ChangeRoleBodyDto {
  @IsEnum(UserRolesEnum)
  role: UserRolesEnum;
}
