import { UserRole, UserStatus } from '@CustomTypes/common.types';

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}
