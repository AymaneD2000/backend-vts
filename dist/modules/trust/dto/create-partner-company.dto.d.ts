import { CompanyType } from '../entities/partner-company.entity';
export declare class CreatePartnerCompanyDto {
    name: string;
    companyType?: CompanyType;
    managerUserId?: string;
    contractRef?: string;
    phone?: string;
    address?: string;
}
