export declare enum DevicePlatform {
    ANDROID = "android",
    IOS = "ios",
    WEB = "web"
}
export declare class DeviceToken {
    id: string;
    userId: string;
    token: string;
    platform: DevicePlatform;
    createdAt: Date;
    updatedAt: Date;
}
