declare const _default: () => {
    env: string;
    port: number;
    database: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
        synchronize: boolean;
    };
    redis: {
        host: string;
        port: number;
    };
    jwt: {
        accessSecret: string;
        accessTtl: string;
        refreshSecret: string;
        refreshTtl: string;
    };
    otp: {
        ttlSeconds: number;
        length: number;
        smsProvider: string;
    };
    push: {
        provider: string;
        credentialsFile: string;
    };
    admin: {
        phones: string[];
    };
    kyc: {
        uploadDir: string;
    };
};
export default _default;
