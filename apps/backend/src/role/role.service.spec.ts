import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RoleService } from './role.service';
import { PrismaService } from '../prisma/prisma.service';
import { DataScope } from '@shared';

describe('RoleService', () => {
  let service: RoleService;

  const mockRole = {
    id: 'role-1',
    name: '测试角色',
    description: '测试角色描述',
    isSystem: false,
    dataScope: 'ORG',
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [{ permissionCode: 'user:read' }],
    users: [],
  };

  const mockSystemRole = {
    ...mockRole,
    id: 'role-admin',
    name: '超级管理员',
    isSystem: true,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      role: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      rolePermission: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      userRole: {
        count: jest.fn(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $transaction: jest.fn((fn: any) => fn(mockPrismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  describe('findAll', () => {
    it('should return all roles with permission codes and user count', async () => {
      mockPrismaService.role.findMany.mockResolvedValue([mockRole]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockRole.id,
        name: mockRole.name,
        isSystem: mockRole.isSystem,
        permissionCodes: ['user:read'],
        userCount: 0,
      });
    });
  });

  describe('create', () => {
    it('should create a role with permissions', async () => {
      const dto = {
        name: '新角色',
        dataScope: DataScope.ORG,
        permissionCodes: ['user:read', 'org:read'],
      };
      mockPrismaService.role.create.mockResolvedValue({ ...mockRole, name: dto.name });

      const result = await service.create(dto);

      expect(mockPrismaService.role.create).toHaveBeenCalled();
      expect(mockPrismaService.rolePermission.createMany).toHaveBeenCalled();
      expect(result.permissionCodes).toEqual(dto.permissionCodes);
    });

    it('should throw BadRequestException for invalid permissions', async () => {
      const dto = {
        name: '新角色',
        dataScope: DataScope.ORG,
        permissionCodes: ['invalid:permission'],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update role name and permissions', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.role.update.mockResolvedValue({ ...mockRole, name: '更新后的角色' });

      const dto = { name: '更新后的角色', permissionCodes: ['user:read', 'user:create'] };
      const result = await service.update('role-1', dto);

      expect(mockPrismaService.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 'role-1' },
      });
      expect(mockPrismaService.rolePermission.createMany).toHaveBeenCalled();
      expect(result.permissionCodes).toEqual(dto.permissionCodes);
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when renaming system role', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockSystemRole);

      await expect(service.update('role-admin', { name: '新名称' })).rejects.toThrow(
        '系统角色不允许重命名',
      );
    });
  });

  describe('remove', () => {
    it('should delete role and its permissions', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.userRole.count.mockResolvedValue(0);

      const result = await service.remove('role-1');

      expect(mockPrismaService.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 'role-1' },
      });
      expect(mockPrismaService.role.delete).toHaveBeenCalledWith({ where: { id: 'role-1' } });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when deleting system role', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockSystemRole);

      await expect(service.remove('role-admin')).rejects.toThrow('系统角色不允许删除');
    });

    it('should throw BadRequestException when role has users', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.userRole.count.mockResolvedValue(5);

      await expect(service.remove('role-1')).rejects.toThrow('角色已分配用户，无法删除');
    });
  });
});
