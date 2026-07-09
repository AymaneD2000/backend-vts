import { Request } from 'express';
import { AuthService } from './auth.service';
import { RefreshDto, RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    requestOtp(dto: RequestOtpDto): Promise<{
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<import("./auth.service").AuthTokens>;
    refresh(dto: RefreshDto): Promise<import("./auth.service").AuthTokens>;
    logout(req: Request): Promise<{
        message: string;
    }>;
    me(req: Request): Express.User | undefined;
}
