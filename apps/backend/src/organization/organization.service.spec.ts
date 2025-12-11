import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { PrismaService } from '../prisma/prisma.service';
import { DataScope } from '@shared';
import type { CurrentUser } from '../common/scoped.service';

describe('OrganizationService', () => {
  let service: OrganizationService;

  const mockOrg = {
    id: 'org-1',
    name: '总公司',
    code: 'ROOT',
    parentId: null,
    path: '/org-1/',
    level: 0,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChildOrg = {
    ...mockOrg,
    id: 'org-2',
    name: '技术部',
    code: 'TECH',
    parentId: 'org-1',
    path: '/org-1/org-2/',
    level: 1,
  };

  const adminUser: CurrentUser = {
    id: 'user-1',
    username: 'admin',
    orgId: 'org-1',
    orgPath: '/org-1/',
    dataScope: DataScope.ALL,
    permissions: ['org:read', 'org:create', 'org:update', 'org:delete'],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      organization: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      user: {
        count: jest.fn(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $transaction: jest.fn((fn: any) => fn(mockPrismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  describe('getTree', () => {
    it('should return organization tree for admin user', async () => {
      mockPrismaService.organization.findMany.mockResolvedValue([mockOrg, mockChildOrg]);

      const result = await service.getTree(adminUser);

      expect(result).toHaveLength(1); // Only root level
      expect(result[0].name).toBe('总公司');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children![0].name).toBe('技术部');
    });

    it('should filter organizations by data scope for ORG user', async () => {
      const orgUser: CurrentUser = { ...adminUser, dataScope: DataScope.ORG };
      mockPrismaService.organization.findMany.mockResolvedValue([mockOrg]);

      await service.getTree(orgUser);

      expect(mockPrismaService.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orgUser.orgId },
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a root organization', async () => {
      const dto = { name: '新公司', code: 'NEW' };
      mockPrismaService.organization.create.mockResolvedValue({
        ...mockOrg,
        id: 'new-org',
        name: dto.name,
      });
      mockPrismaService.organization.update.mockResolvedValue({
        ...mockOrg,
        id: 'new-org',
        name: dto.name,
        path: '/new-org/',
      });

      const result = await service.create(adminUser, dto);

      expect(mockPrismaService.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: dto.name,
            code: dto.code,
            level: 0,
          }),
        }),
      );
      expect(result.path).toBe('/new-org/');
    });

    it('should create a child organization', async () => {
      const dto = { name: '子部门', code: 'CHILD', parentId: 'org-1' };
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.organization.create.mockResolvedValue({ ...mockChildOrg, id: 'new-child' });
      mockPrismaService.organization.update.mockResolvedValue({
        ...mockChildOrg,
        id: 'new-child',
        path: '/org-1/new-child/',
      });

      await service.create(adminUser, dto);

      expect(mockPrismaService.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            level: 1,
            parentId: 'org-1',
          }),
        }),
      );
    });

    it('should throw NotFoundException if parent not found', async () => {
      const dto = { name: '子部门', code: 'CHILD', parentId: 'nonexistent' };
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.create(adminUser, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update organization name', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.organization.update.mockResolvedValue({ ...mockOrg, name: '新名称' });
      mockPrismaService.organization.findMany.mockResolvedValue([]);

      const result = await service.update(adminUser, 'org-1', { name: '新名称' });

      expect(result.name).toBe('新名称');
    });

    it('should throw NotFoundException if organization not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.update(adminUser, 'nonexistent', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when setting org as its own parent', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(service.update(adminUser, 'org-1', { parentId: 'org-1' })).rejects.toThrow(
        '不能将组织设为自身的父级',
      );
    });
  });

  describe('remove', () => {
    it('should delete organization', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.organization.count.mockResolvedValue(0);
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await service.remove(adminUser, 'org-1');

      expect(mockPrismaService.organization.delete).toHaveBeenCalledWith({
        where: { id: 'org-1' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if organization not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.remove(adminUser, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if organization has children', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.organization.count.mockResolvedValue(2);

      await expect(service.remove(adminUser, 'org-1')).rejects.toThrow('存在子组织，无法删除');
    });

    it('should throw BadRequestException if organization has users', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.organization.count.mockResolvedValue(0);
      mockPrismaService.user.count.mockResolvedValue(5);

      await expect(service.remove(adminUser, 'org-1')).rejects.toThrow('组织下存在用户，无法删除');
    });
  });
});
