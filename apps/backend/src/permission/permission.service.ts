import { Injectable } from '@nestjs/common';
import { PERMISSION_METADATA, getPermissionsByModule } from '@shared';

@Injectable()
export class PermissionService {
  findAll() {
    return PERMISSION_METADATA;
  }

  findGrouped() {
    return getPermissionsByModule();
  }
}
