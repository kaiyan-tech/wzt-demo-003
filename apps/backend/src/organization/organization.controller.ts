import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { Permission } from '@shared';
import type { CurrentUser } from '../common/scoped.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

type AuthenticatedRequest = Request & { user: CurrentUser };

@Controller('orgs')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('tree')
  @RequirePermissions(Permission.ORG_READ)
  findTree(@Request() req: AuthenticatedRequest) {
    return this.organizationService.getTree(req.user);
  }

  @Post()
  @RequirePermissions(Permission.ORG_CREATE)
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(req.user, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ORG_UPDATE)
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(req.user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.ORG_DELETE)
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.organizationService.remove(req.user, id);
  }
}
