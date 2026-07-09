import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';
import { AssignTrustDto } from './dto/assign-trust.dto';
import { CreateGuarantorDto } from './dto/create-guarantor.dto';
import { CreatePartnerCompanyDto } from './dto/create-partner-company.dto';
import { UpdateGuarantorDto } from './dto/update-guarantor.dto';
import { UpdatePartnerCompanyDto } from './dto/update-partner-company.dto';
import { UpdateTrustConfigDto } from './dto/update-trust-config.dto';
import { TrustService } from './trust.service';

// All trust administration is admin-only.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('trust')
export class TrustController {
  constructor(private readonly trust: TrustService) {}

  // --- Guarantors ---

  @Post('guarantors')
  createGuarantor(@Body() dto: CreateGuarantorDto) {
    return this.trust.createGuarantor(dto);
  }

  @Get('guarantors')
  listGuarantors() {
    return this.trust.listGuarantors();
  }

  @Patch('guarantors/:id')
  updateGuarantor(@Param('id') id: string, @Body() dto: UpdateGuarantorDto) {
    return this.trust.updateGuarantor(id, dto);
  }

  @Post('guarantors/:id/verify')
  verifyGuarantor(@Param('id') id: string) {
    return this.trust.verifyGuarantor(id, true);
  }

  // --- Partner companies ---

  @Post('companies')
  createCompany(@Body() dto: CreatePartnerCompanyDto) {
    return this.trust.createCompany(dto);
  }

  @Get('companies')
  listCompanies() {
    return this.trust.listCompanies();
  }

  @Patch('companies/:id')
  updateCompany(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerCompanyDto,
  ) {
    return this.trust.updateCompany(id, dto);
  }

  // --- Driver assignment ---

  @Post('assign')
  assign(@Body() dto: AssignTrustDto) {
    return this.trust.assign(dto);
  }

  // --- Config ---

  @Get('config')
  listConfig() {
    return this.trust.listConfig();
  }

  @Patch('config')
  updateConfig(@Body() dto: UpdateTrustConfigDto) {
    return this.trust.updateConfig(dto);
  }
}
