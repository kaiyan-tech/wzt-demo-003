import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Permission } from '@shared';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermissions(Permission.ROLE_READ)
  findAll() {
    return this.roleService.findAll();
  }

  @Post()
  @RequirePermissions(Permission.ROLE_CREATE)
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ROLE_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.ROLE_DELETE)
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
