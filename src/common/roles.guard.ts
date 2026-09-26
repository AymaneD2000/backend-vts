import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../modules/users/entities/user.entity';
import { AuthUser } from './current-user.decorator';
import { CurrentRolesService } from './current-roles.service';
import { ROLES_KEY } from './roles.decorator';

// Checks the authenticated user has at least one of the required roles.
// Use after JwtAuthGuard so request.user is populated.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly currentRoles: CurrentRolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    if (!user?.userId) return false;
    await this.currentRoles.requireAny(user.userId, required);
    return true;
  }
}
