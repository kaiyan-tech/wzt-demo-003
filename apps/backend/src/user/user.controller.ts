import { Controller, Get, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from '../common/scoped.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@Request() req: { user: CurrentUser }) {
    return this.userService.findSummary(req.user.id);
  }
}
