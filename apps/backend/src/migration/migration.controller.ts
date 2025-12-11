import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MigrationService } from './migration.service';
import { RunMigrationDto } from './dto/run-migration.dto';
import { Public } from '../common/decorators/permissions.decorator';

@Controller('internal')
export class MigrationController {
  private readonly migrationToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly migrationService: MigrationService,
  ) {
    this.migrationToken = this.configService.get<string>('MIGRATION_TOKEN') || '';
  }

  @Public()
  @Post('db-migrate')
  @HttpCode(HttpStatus.OK)
  async runMigration(@Headers('x-migration-token') token: string, @Body() body: RunMigrationDto) {
    if (!this.migrationToken || token !== this.migrationToken) {
      throw new UnauthorizedException('Invalid migration token');
    }

    const result = await this.migrationService.runMigration(body);

    return {
      success: result.success,
      message: result.message,
      env: body.env,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  @Public()
  @Post('db-seed')
  @HttpCode(HttpStatus.OK)
  async runSeed(@Headers('x-migration-token') token: string, @Body() body: { gitSha?: string }) {
    if (!this.migrationToken || token !== this.migrationToken) {
      throw new UnauthorizedException('Invalid migration token');
    }

    try {
      const result = await this.migrationService.runSeed();
      return {
        success: true,
        message: 'Seed completed',
        gitSha: body?.gitSha,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message,
        gitSha: body?.gitSha,
      };
    }
  }
}
