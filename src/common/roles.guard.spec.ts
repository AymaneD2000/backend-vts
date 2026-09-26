import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../modules/users/entities/user.entity';
import { CurrentRolesService } from './current-roles.service';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('keeps OR semantics while checking current database roles', async () => {
    class TestController {
      @Roles(UserRole.ADMIN, UserRole.MERCHANT)
      handle() {
        return true;
      }
    }
    const handler = TestController.prototype.handle;
    const currentRoles = {
      requireAny: jest.fn().mockResolvedValue(undefined),
    } as unknown as CurrentRolesService;
    const guard = new RolesGuard(new Reflector(), currentRoles);
    const context = {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { userId: 'u1' } }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(currentRoles.requireAny).toHaveBeenCalledWith('u1', [
      UserRole.ADMIN,
      UserRole.MERCHANT,
    ]);
  });

  it('allows routes without role metadata', async () => {
    const currentRoles = { requireAny: jest.fn() } as unknown as CurrentRolesService;
    const guard = new RolesGuard(new Reflector(), currentRoles);
    const context = {
      getHandler: () => () => true,
      getClass: () => class Empty {},
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(currentRoles.requireAny).not.toHaveBeenCalled();
  });
});
