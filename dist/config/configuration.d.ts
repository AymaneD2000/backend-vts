declare const _default: () => {
    env: string;
    port: number;
    database: {
        url: string;
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
        synchronize: boolean;
        migrationsRun: boolean;
        ssl: boolean;
    };
    redis: {
        url: string;
        host: string;
        port: number;
        password: string;
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
        cooldownSeconds: number;
        maxAttempts: number;
        smsProvider: string;
    };
    email: {
        provider: string;
        host: string;
        port: number;
        secure: boolean;
        user: string;
        password: string;
        from: string;
    };
    push: {
        provider: string;
        credentialsFile: string;
    };
    admin: {
        phones: string[];
        emails: string[];
    };
    kyc: {
        uploadDir: string;
    };
};
export default _default;
