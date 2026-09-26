import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRole } from '../modules/users/entities/user.entity';
import { UsersService } from '../modules/users/users.service';
import { ApplicationError, ApplicationErrorCode } from './application-error';

@Injectable()
export class CurrentRolesService {
  constructor(private readonly users: UsersService) {}

  async require(userId: string, role: UserRole): Promise<void> {
    await this.requireAny(userId, [role]);
  }

  async requireAny(userId: string, roles: readonly UserRole[]): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || !roles.some((role) => user.roles.includes(role))) {
      throw new ApplicationError(
        HttpStatus.FORBIDDEN,
        ApplicationErrorCode.FORBIDDEN,
        'Permissions insuffisantes.',
      );
    }
  }
}
