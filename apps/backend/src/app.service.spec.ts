import { AppService } from './app.service';

describe('AppService', () => {
  const originalVersion = process.env.APP_VERSION;

  afterEach(() => {
    process.env.APP_VERSION = originalVersion;
  });

  it('should prefer APP_VERSION when provided', () => {
    process.env.APP_VERSION = 'test-version';
    const service = new AppService();
    const result = service.healthCheck();
    expect(result.version).toBe('test-version');
  });
});
