import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp/otp.service';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly users;
    private readonly otp;
    private readonly jwt;
    private readonly config;
    constructor(users: UsersService, otp: OtpService, jwt: JwtService, config: ConfigService);
    requestOtp(phone?: string, email?: string): Promise<void>;
    verifyOtp(phone: string | undefined, email: string | undefined, code: string): Promise<AuthTokens>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    logout(userId: string): Promise<void>;
    private issueTokens;
    private resolveIdentity;
}
