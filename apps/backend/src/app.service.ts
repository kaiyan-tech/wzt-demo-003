import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck() {
    const version =
      process.env.APP_VERSION ||
      process.env.FC_QUALIFIER ||
      process.env.npm_package_version ||
      '1.0.0';
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version,
    };
  }
}
