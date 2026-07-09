import { DevicePlatform } from '../entities/device-token.entity';
export declare class RegisterTokenDto {
    token: string;
    platform?: DevicePlatform;
}
export declare class UnregisterTokenDto {
    token: string;
}
