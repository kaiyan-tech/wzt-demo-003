import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataScope, type OrganizationTreeNode } from '@shared';
import { PrismaService } from '../prisma/prisma.service';
import { ScopedService, type CurrentUser } from '../common/scoped.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService extends ScopedService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getTree(currentUser: CurrentUser): Promise<OrganizationTreeNode[]> {
    const orgs = await this.getAccessibleOrganizations(currentUser);
    return this.buildTree(orgs);
  }

  private async getAccessibleOrganizations(currentUser: CurrentUser) {
    const where =
      currentUser.dataScope === DataScope.ALL
        ? {}
        : currentUser.dataScope === DataScope.ORG_TREE
          ? {
              path: { startsWith: currentUser.orgPath },
            }
          : { id: currentUser.orgId }; // ORG/SELF: 仅本组织

    return this.prisma.organization.findMany({
      where,
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(currentUser: CurrentUser, dto: CreateOrganizationDto) {
    let parentPath = '/';
    let level = 0;
    if (dto.parentId) {
      const parent = await this.prisma.organization.findUnique({
        where: { id: dto.parentId },
        select: { path: true, level: true },
      });
      if (!parent) {
        throw new NotFoundException('上级组织不存在');
      }
      const canAccess = await this.canAccessOrg(currentUser, dto.parentId);
      if (!canAccess) {
        throw new ForbiddenException('无权在该组织下创建节点');
      }
      parentPath = parent.path;
      level = parent.level + 1;
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        code: dto.code,
        parentId: dto.parentId ?? null,
        path: '',
        level,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    const path = `${parentPath}${org.id}/`;
    return this.prisma.organization.update({
      where: { id: org.id },
      data: { path },
    });
  }

  async update(currentUser: CurrentUser, id: string, dto: UpdateOrganizationDto) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException('组织不存在');
    }
    if (
      !(await this.canAccessOrg(currentUser, org.id)) &&
      currentUser.dataScope !== DataScope.ALL
    ) {
      throw new ForbiddenException('无权操作该组织');
    }

    let targetParentId = org.parentId;
    if (dto.parentId !== undefined) {
      targetParentId = dto.parentId ?? null;
    }

    let parentPath = this.getParentPath(org.path);
    let level = org.level;
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('不能将组织设为自身的父级');
      }
      if (targetParentId) {
        const parent = await this.prisma.organization.findUnique({
          where: { id: targetParentId },
          select: { path: true, level: true },
        });
        if (!parent) {
          throw new NotFoundException('上级组织不存在');
        }
        if (!(await this.canAccessOrg(currentUser, targetParentId))) {
          throw new ForbiddenException('无权移动到该组织下');
        }
        if (parent.path.startsWith(org.path)) {
          throw new BadRequestException('不能将组织移动到自己的子节点');
        }
        parentPath = parent.path;
        level = parent.level + 1;
      } else {
        parentPath = '/';
        level = 0;
      }
    }

    const newPath =
      dto.parentId !== undefined && `${parentPath}${org.id}/` !== org.path
        ? `${parentPath}${org.id}/`
        : org.path;
    const levelOffset = level - org.level;
    const pathChanged = newPath !== org.path;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.organization.update({
        where: { id },
        data: {
          name: dto.name ?? org.name,
          code: dto.code ?? org.code,
          parentId: targetParentId,
          sortOrder: dto.sortOrder ?? org.sortOrder,
          path: newPath,
          level,
        },
      });

      if (pathChanged) {
        const descendants = await tx.organization.findMany({
          where: {
            path: { startsWith: org.path },
            NOT: { id },
          },
          orderBy: { level: 'asc' },
        });

        for (const descendant of descendants) {
          const suffix = descendant.path.replace(org.path, '');
          await tx.organization.update({
            where: { id: descendant.id },
            data: {
              path: `${newPath}${suffix}`,
              level: descendant.level + levelOffset,
            },
          });
        }
      }

      return updated;
    });
  }

  async remove(currentUser: CurrentUser, id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException('组织不存在');
    }
    if (
      !(await this.canAccessOrg(currentUser, org.id)) &&
      currentUser.dataScope !== DataScope.ALL
    ) {
      throw new ForbiddenException('无权删除该组织');
    }

    const childrenCount = await this.prisma.organization.count({ where: { parentId: id } });
    if (childrenCount > 0) {
      throw new BadRequestException('存在子组织，无法删除');
    }
    const userCount = await this.prisma.user.count({ where: { orgId: id } });
    if (userCount > 0) {
      throw new BadRequestException('组织下存在用户，无法删除');
    }

    await this.prisma.organization.delete({ where: { id } });
    return { success: true };
  }

  private buildTree(
    orgs: Array<{
      id: string;
      name: string;
      code: string;
      parentId: string | null;
      path: string;
      level: number;
      sortOrder: number;
    }>,
  ): OrganizationTreeNode[] {
    const map = new Map<string, OrganizationTreeNode>();
    const roots: OrganizationTreeNode[] = [];

    for (const org of orgs) {
      map.set(org.id, { ...org, children: [] });
    }

    for (const org of orgs) {
      const node = map.get(org.id)!;
      if (org.parentId && map.has(org.parentId)) {
        map.get(org.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortNodes = (nodes: OrganizationTreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach((n) => n.children && sortNodes(n.children));
    };
    sortNodes(roots);

    return roots;
  }

  private getParentPath(path: string) {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    if (parts.length === 0) return '/';
    return `/${parts.join('/')}/`;
  }
}
