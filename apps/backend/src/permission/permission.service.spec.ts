import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { PERMISSION_METADATA } from '@shared';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionService],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  describe('findAll', () => {
    it('should return all permission metadata', () => {
      const result = service.findAll();

      expect(result).toEqual(PERMISSION_METADATA);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('code');
      expect(result[0]).toHaveProperty('module');
      expect(result[0]).toHaveProperty('description');
    });
  });

  describe('findGrouped', () => {
    it('should return permissions grouped by module', () => {
      const result = service.findGrouped();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      // 应该包含用户、组织、角色等模块
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should group user permissions correctly', () => {
      const result = service.findGrouped();

      // 检查是否有用户模块
      const hasUserModule = Object.keys(result).some((key) =>
        result[key].some((p) => p.code.startsWith('user:')),
      );
      expect(hasUserModule).toBe(true);
    });
  });
});
