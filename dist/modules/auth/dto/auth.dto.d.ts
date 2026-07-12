export declare class RequestOtpDto {
    phone?: string;
    email?: string;
}
export declare class VerifyOtpDto {
    phone?: string;
    email?: string;
    code: string;
    fullName?: string;
}
export declare class RefreshDto {
    refreshToken: string;
}
