import { CompanyStatus, CompanyType } from '../entities/partner-company.entity';
export declare class UpdatePartnerCompanyDto {
    name?: string;
    companyType?: CompanyType;
    status?: CompanyStatus;
    managerUserId?: string;
    contractRef?: string;
    phone?: string;
    address?: string;
    subscriptionExpiresAt?: string;
}
