export declare class RequestOtpDto {
    phone: string;
}
export declare class VerifyOtpDto {
    phone: string;
    code: string;
    fullName?: string;
}
export declare class RefreshDto {
    refreshToken: string;
}
