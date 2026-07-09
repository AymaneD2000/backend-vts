import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../modules/users/entities/user.entity';

export const ROLES_KEY = 'roles';

// Marks a route as requiring one of the given roles. Pair with RolesGuard.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
