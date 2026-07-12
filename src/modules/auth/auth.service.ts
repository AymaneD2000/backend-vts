import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp/otp.service';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async requestOtp(phone?: string, email?: string): Promise<void> {
    const identity = this.resolveIdentity(phone, email);
    if (identity.channel === 'email') {
      await this.users.findOrCreateByEmail(identity.value);
    } else {
      await this.users.findOrCreateByPhone(identity.value);
    }
    await this.otp.requestOtp(identity.value, identity.channel);
  }

  async verifyOtp(
    phone: string | undefined,
    email: string | undefined,
    code: string,
  ): Promise<AuthTokens> {
    const identity = this.resolveIdentity(phone, email);
    const ok = await this.otp.verifyOtp(
      identity.value,
      identity.channel,
      code,
    );
    if (!ok) throw new UnauthorizedException('Invalid or expired code');

    let user =
      identity.channel === 'email'
        ? await this.users.findByEmail(identity.value)
        : await this.users.findByPhone(identity.value);
    if (!user) throw new UnauthorizedException('User not found');

    if (identity.channel === 'email' && !user.emailVerified) {
      await this.users.markEmailVerified(user.id);
    } else if (identity.channel === 'phone' && !user.phoneVerified) {
      await this.users.markPhoneVerified(user.id);
    }

    // Grant admin to allowlisted phones so operators can review KYC etc.
    const adminPhones = this.config.get<string[]>('admin.phones') ?? [];
    const adminEmails = this.config.get<string[]>('admin.emails') ?? [];
    if (
      (user.phone && adminPhones.includes(user.phone)) ||
      (user.email && adminEmails.includes(user.email))
    ) {
      user = await this.users.addRole(user, UserRole.ADMIN);
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedHash = await this.users.getRefreshTokenHash(payload.sub);
    if (!storedHash || !(await argon2.verify(storedHash, refreshToken))) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.users.setRefreshTokenHash(userId, null);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessTtl'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshTtl'),
    });

    const refreshHash = await argon2.hash(refreshToken);
    await this.users.setRefreshTokenHash(user.id, refreshHash);

    return { accessToken, refreshToken };
  }

  private resolveIdentity(
    phone?: string,
    email?: string,
  ): { channel: 'phone' | 'email'; value: string } {
    if ((!phone && !email) || (phone && email)) {
      throw new BadRequestException('Provide either phone or email');
    }
    if (email) {
      return { channel: 'email', value: email.trim().toLowerCase() };
    }
    return { channel: 'phone', value: phone! };
  }
}
