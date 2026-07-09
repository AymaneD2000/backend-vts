import { AssignTrustDto } from './dto/assign-trust.dto';
import { CreateGuarantorDto } from './dto/create-guarantor.dto';
import { CreatePartnerCompanyDto } from './dto/create-partner-company.dto';
import { UpdateGuarantorDto } from './dto/update-guarantor.dto';
import { UpdatePartnerCompanyDto } from './dto/update-partner-company.dto';
import { UpdateTrustConfigDto } from './dto/update-trust-config.dto';
import { TrustService } from './trust.service';
export declare class TrustController {
    private readonly trust;
    constructor(trust: TrustService);
    createGuarantor(dto: CreateGuarantorDto): Promise<import("./entities/guarantor.entity").Guarantor>;
    listGuarantors(): Promise<import("./entities/guarantor.entity").Guarantor[]>;
    updateGuarantor(id: string, dto: UpdateGuarantorDto): Promise<import("./entities/guarantor.entity").Guarantor>;
    verifyGuarantor(id: string): Promise<import("./entities/guarantor.entity").Guarantor>;
    createCompany(dto: CreatePartnerCompanyDto): Promise<import("./entities/partner-company.entity").PartnerCompany>;
    listCompanies(): Promise<import("./entities/partner-company.entity").PartnerCompany[]>;
    updateCompany(id: string, dto: UpdatePartnerCompanyDto): Promise<import("./entities/partner-company.entity").PartnerCompany>;
    assign(dto: AssignTrustDto): Promise<import("../users/entities/driver-profile.entity").DriverProfile>;
    listConfig(): Promise<import("./entities/trust-config.entity").TrustConfig[]>;
    updateConfig(dto: UpdateTrustConfigDto): Promise<import("./entities/trust-config.entity").TrustConfig>;
}
