import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findByPhone(phone: string): Promise<User | null> {
    return this.users.findOne({ where: { phone } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: this.normalizeEmail(email) } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async createWithPhone(phone: string, roles: UserRole[] = [UserRole.CLIENT]): Promise<User> {
    const user = this.users.create({ phone, roles });
    return this.users.save(user);
  }

  async findOrCreateByPhone(phone: string): Promise<User> {
    const existing = await this.findByPhone(phone);
    if (existing) return existing;
    return this.createWithPhone(phone);
  }

  async createWithEmail(
    email: string,
    roles: UserRole[] = [UserRole.CLIENT],
  ): Promise<User> {
    const user = this.users.create({
      email: this.normalizeEmail(email),
      roles,
    });
    return this.users.save(user);
  }

  async findOrCreateByEmail(email: string): Promise<User> {
    const normalized = this.normalizeEmail(email);
    const existing = await this.findByEmail(normalized);
    if (existing) return existing;
    return this.createWithEmail(normalized);
  }

  async markPhoneVerified(id: string): Promise<void> {
    await this.users.update({ id }, { phoneVerified: true });
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.users.update({ id }, { emailVerified: true });
  }

  // Adds a role to a user if missing. Returns the (possibly) updated user.
  async addRole(user: User, role: UserRole): Promise<User> {
    if (user.roles.includes(role)) return user;
    user.roles = [...user.roles, role];
    return this.users.save(user);
  }

  async setRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.users.update({ id }, { refreshTokenHash: hash ?? undefined });
  }

  async getRefreshTokenHash(id: string): Promise<string | null> {
    const user = await this.users.findOne({
      where: { id },
      select: { id: true, refreshTokenHash: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.refreshTokenHash ?? null;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
