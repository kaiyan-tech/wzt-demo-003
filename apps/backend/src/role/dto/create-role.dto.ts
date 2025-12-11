import { IsArray, IsEnum, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';
import { DataScope } from '@shared';

export class CreateRoleDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DataScope)
  dataScope!: DataScope;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionCodes!: string[];
}
