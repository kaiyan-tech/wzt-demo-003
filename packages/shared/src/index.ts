/**
 * @shared - 前后端共享包
 *
 * 参考：《开沿核心技术宪章》3.2 节 - 共享包规范
 * 参考：《开沿工程指导手册》1.3 节 - 共享包使用指南
 *
 * 使用方式：
 * import { UserDTO, formatDate } from '@shared';
 */

// DTO 导出
export * from './dto/auth.dto';
export * from './dto/user.dto';

// 类型导出
export * from './types/api.types';
export * from './types/common.types';
export * from './types/admin.types';

// 工具函数导出
export * from './utils/date';
export * from './utils/format';

// 权限枚举导出
export * from './permissions';
