import { IsEmail, IsString, IsOptional } from 'class-validator';

/**
 * 用户信息 DTO
 */
export class UserDto {
  id!: string;
  email!: string;
  name?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * 更新用户信息 DTO
 */
export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
