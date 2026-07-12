import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
export declare class UsersService {
    private readonly users;
    constructor(users: Repository<User>);
    findByPhone(phone: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    createWithPhone(phone: string, roles?: UserRole[]): Promise<User>;
    findOrCreateByPhone(phone: string): Promise<User>;
    createWithEmail(email: string, roles?: UserRole[]): Promise<User>;
    findOrCreateByEmail(email: string): Promise<User>;
    markPhoneVerified(id: string): Promise<void>;
    markEmailVerified(id: string): Promise<void>;
    addRole(user: User, role: UserRole): Promise<User>;
    setRefreshTokenHash(id: string, hash: string | null): Promise<void>;
    getRefreshTokenHash(id: string): Promise<string | null>;
    private normalizeEmail;
}
