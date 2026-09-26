import { UserRole } from '../modules/users/entities/user.entity';
import { ApplicationError } from './application-error';
import { CurrentRolesService } from './current-roles.service';

describe('CurrentRolesService', () => {
  it('rejects a role present only in a stale JWT', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue({
        id: 'u1',
        roles: [UserRole.CLIENT],
      }),
    };
    const service = new CurrentRolesService(users as never);

    await expect(service.require('u1', UserRole.ADMIN)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'FORBIDDEN' }),
    });
  });

  it('accepts any one of the current roles', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue({
        id: 'u1',
        roles: [UserRole.MERCHANT],
      }),
    };
    const service = new CurrentRolesService(users as never);

    await expect(
      service.requireAny('u1', [UserRole.ADMIN, UserRole.MERCHANT]),
    ).resolves.toBeUndefined();
  });

  it('fails closed when the user no longer exists', async () => {
    const service = new CurrentRolesService({
      findById: jest.fn().mockResolvedValue(null),
    } as never);

    await expect(service.require('u1', UserRole.ADMIN)).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });
});
