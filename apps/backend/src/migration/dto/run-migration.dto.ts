import { IsIn, IsOptional, IsString } from 'class-validator';

export class RunMigrationDto {
  @IsIn(['prod'])
  env = 'prod' as const;

  @IsOptional()
  @IsString()
  gitSha?: string;
}
