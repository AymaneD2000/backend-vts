import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { OtpService } from './otp/otp.service';

describe('AuthService email OTP', () => {
  let users: jest.Mocked<
    Pick<
      UsersService,
      | 'findOrCreateByEmail'
      | 'findOrCreateByPhone'
      | 'findByEmail'
      | 'findByPhone'
      | 'markEmailVerified'
      | 'markPhoneVerified'
      | 'addRole'
      | 'setRefreshTokenHash'
    >
  >;
  let otp: jest.Mocked<Pick<OtpService, 'requestOtp' | 'verifyOtp'>>;
  let jwt: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let service: AuthService;

  beforeEach(() => {
    users = {
      findOrCreateByEmail: jest.fn(),
      findOrCreateByPhone: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      markEmailVerified: jest.fn(),
      markPhoneVerified: jest.fn(),
      addRole: jest.fn(),
      setRefreshTokenHash: jest.fn(),
    } as any;
    otp = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
    } as any;
    jwt = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    } as any;
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'admin.phones' || key === 'admin.emails') return [];
        if (key === 'jwt.accessSecret') return 'access-secret';
        if (key === 'jwt.refreshSecret') return 'refresh-secret';
        if (key === 'jwt.accessTtl') return '15m';
        if (key === 'jwt.refreshTtl') return '30d';
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new AuthService(
      users as any,
      otp as any,
      jwt as any,
      config,
    );
  });

  it('normalizes email before creating the user and sending the OTP', async () => {
    await service.requestOtp(undefined, '  USER@Example.COM ');

    expect(users.findOrCreateByEmail).toHaveBeenCalledWith('user@example.com');
    expect(otp.requestOtp).toHaveBeenCalledWith(
      'user@example.com',
      'email',
    );
    expect(users.findOrCreateByPhone).not.toHaveBeenCalled();
  });

  it('marks the email verified and includes it in issued tokens', async () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: false,
      phoneVerified: false,
      roles: [UserRole.CLIENT],
    } as User;
    otp.verifyOtp.mockResolvedValue(true);
    users.findByEmail.mockResolvedValue(user);

    const tokens = await service.verifyOtp(
      undefined,
      'USER@Example.COM',
      '123456',
    );

    expect(users.markEmailVerified).toHaveBeenCalledWith('user-1');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' }),
      expect.any(Object),
    );
    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('rejects a request containing both phone and email', async () => {
    await expect(
      service.requestOtp('70000000', 'user@example.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
