import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DataScope } from '@shared';

/**
 * 当前用户上下文接口
 * 包含用户认证和权限信息
 */
export interface CurrentUser {
  id: string;
  username: string;
  orgId: string;
  orgPath: string; // 组织路径,用于 ORG_TREE 查询
  dataScope: DataScope;
  permissions: string[];
}

/**
 * ScopedService 基类
 *
 * 提供基于数据范围的自动过滤功能
 * 所有需要数据范围控制的 Service 都应继承此类
 *
 * 使用示例:
 * ```typescript
 * @Injectable()
 * export class UserService extends ScopedService {
 *   constructor(prisma: PrismaService) {
 *     super(prisma);
 *   }
 *
 *   async findAll(currentUser: CurrentUser) {
 *     const scopeFilter = this.getScopeFilter(currentUser, 'orgId', 'createdBy');
 *     return this.prisma.user.findMany({
 *       where: scopeFilter,
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class ScopedService {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * 根据用户数据范围生成 Prisma WHERE 条件
   *
   * @param currentUser 当前用户
   * @param orgField 实体的组织字段名,默认 'orgId'
   * @param createdByField 实体的创建者字段名,默认 'createdBy'(可选)
   * @returns Prisma WHERE 条件对象
   */
  protected getScopeFilter(
    currentUser: CurrentUser,
    orgField: string = 'orgId',
    createdByField?: string,
  ): Record<string, unknown> {
    switch (currentUser.dataScope) {
      case DataScope.ALL:
        // 全部数据,无过滤
        return {};

      case DataScope.ORG_TREE:
        // 本部门及所有子部门的数据
        // 使用物化路径进行高效查询
        return {
          organization: {
            path: {
              startsWith: currentUser.orgPath,
            },
          },
        };

      case DataScope.ORG:
        // 仅本部门数据
        return {
          [orgField]: currentUser.orgId,
        };

      case DataScope.SELF:
        // 仅本人数据
        if (!createdByField) {
          throw new Error('SELF scope requires createdByField to be specified');
        }
        return {
          [createdByField]: currentUser.id,
        };

      default:
        // 默认最严格:仅本人数据
        if (createdByField) {
          return {
            [createdByField]: currentUser.id,
          };
        }
        return {
          [orgField]: currentUser.orgId,
        };
    }
  }

  /**
   * 根据用户数据范围生成组织 ID 列表
   * 适用于需要显式 orgId IN (...) 查询的场景
   *
   * @param currentUser 当前用户
   * @returns 组织 ID 数组
   */
  protected async getScopeOrgIds(currentUser: CurrentUser): Promise<string[]> {
    switch (currentUser.dataScope) {
      case DataScope.ALL: {
        // 全部组织
        const allOrgs = await this.prisma.organization.findMany({
          select: { id: true },
        });
        return allOrgs.map((org) => org.id);
      }

      case DataScope.ORG_TREE: {
        // 本部门及子部门
        const treeOrgs = await this.prisma.organization.findMany({
          where: {
            path: {
              startsWith: currentUser.orgPath,
            },
          },
          select: { id: true },
        });
        return treeOrgs.map((org) => org.id);
      }

      case DataScope.ORG:
        // 仅本部门
        return [currentUser.orgId];

      case DataScope.SELF:
        // SELF 范围不基于组织过滤
        return [];

      default:
        return [currentUser.orgId];
    }
  }

  /**
   * 检查用户是否有权限访问指定组织的数据
   *
   * @param currentUser 当前用户
   * @param targetOrgId 目标组织 ID
   * @returns 是否有权限
   */
  protected async canAccessOrg(currentUser: CurrentUser, targetOrgId: string): Promise<boolean> {
    switch (currentUser.dataScope) {
      case DataScope.ALL:
        return true;

      case DataScope.ORG_TREE: {
        const targetOrg = await this.prisma.organization.findUnique({
          where: { id: targetOrgId },
          select: { path: true },
        });
        if (!targetOrg) return false;
        return targetOrg.path.startsWith(currentUser.orgPath);
      }

      case DataScope.ORG:
        return targetOrgId === currentUser.orgId;

      case DataScope.SELF:
        // SELF 范围不基于组织判断
        return false;

      default:
        return targetOrgId === currentUser.orgId;
    }
  }
}
