import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

/**
 * 用户注册 DTO
 */
export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email!: string;

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

/**
 * 用户登录 DTO
 */
export class LoginDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email!: string;

  @IsString()
  password!: string;
}

/**
 * 登录响应
 */
export interface AuthResponse {
  accessToken: string;
}
