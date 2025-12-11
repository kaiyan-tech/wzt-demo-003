import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request } from '@nestjs/common';
import { Permission } from '@shared';
import type { CurrentUser } from '../common/scoped.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type AuthenticatedRequest = Request & { user: CurrentUser };

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermissions(Permission.USER_READ)
  findAll(@Request() req: AuthenticatedRequest, @Query() query: QueryUserDto) {
    return this.userService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.USER_READ)
  findOne(@Param('id') id: string) {
    return this.userService.findSummary(id);
  }

  @Post()
  @RequirePermissions(Permission.USER_CREATE)
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateUserDto) {
    return this.userService.createByAdmin(req.user, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.USER_UPDATE)
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateByAdmin(req.user, id, dto);
  }

  @Post(':id/reset-password')
  @RequirePermissions(Permission.USER_RESET_PASSWORD)
  resetPassword(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(req.user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.USER_DELETE)
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.userService.deleteByAdmin(req.user, id);
  }
}
