import { Controller, Get } from '@nestjs/common';
import { Permission } from '@shared';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionService } from './permission.service';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermissions(Permission.ROLE_READ)
  findAll() {
    return {
      items: this.permissionService.findAll(),
      grouped: this.permissionService.findGrouped(),
    };
  }
}
