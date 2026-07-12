import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
export interface JwtPayload {
    sub: string;
    phone?: string;
    email?: string;
    roles: string[];
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: JwtPayload): Promise<{
        userId: string;
        phone: string | undefined;
        email: string | undefined;
        roles: string[];
    }>;
}
export {};
