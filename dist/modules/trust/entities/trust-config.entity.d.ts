import { TrustLevel } from '../../../common/trust-level';
export declare class TrustConfig {
    id: string;
    trustLevel: TrustLevel;
    label: string;
    maxDeclaredValue: number | null;
    updatedAt: Date;
}
