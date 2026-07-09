import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateRentalVehicleDto } from './dto/create-rental-vehicle.dto';
import { UpdateRentalVehicleDto } from './dto/update-rental-vehicle.dto';
import { RentalsService } from './rentals.service';

@UseGuards(JwtAuthGuard)
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentals: RentalsService) {}

  // --- Admin: vehicle catalog ---

  @Post('vehicles')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createVehicle(@Body() dto: CreateRentalVehicleDto) {
    return this.rentals.createVehicle(dto);
  }

  @Get('vehicles')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listVehicles() {
    return this.rentals.listVehicles();
  }

  @Patch('vehicles/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateVehicle(
    @Param('id') id: string,
    @Body() dto: UpdateRentalVehicleDto,
  ) {
    return this.rentals.updateVehicle(id, dto);
  }

  @Get('bookings/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listAllBookings() {
    return this.rentals.listBookings();
  }

  // --- Client ---

  @Get('catalog')
  catalog() {
    return this.rentals.listCatalog();
  }

  @Post('bookings')
  book(@CurrentUser('userId') userId: string, @Body() dto: CreateBookingDto) {
    return this.rentals.book(userId, dto);
  }

  @Get('bookings/mine')
  myBookings(@CurrentUser('userId') userId: string) {
    return this.rentals.myBookings(userId);
  }

  @Get('bookings/:id')
  get(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.rentals.get(id, userId);
  }

  @Post('bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.rentals.cancel(id, userId, dto);
  }

  // --- Driver ---

  @Get('pending')
  pending() {
    return this.rentals.listPending();
  }

  @Post('bookings/:id/accept')
  @HttpCode(HttpStatus.OK)
  accept(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.rentals.accept(id, userId);
  }

  @Post('bookings/:id/start')
  @HttpCode(HttpStatus.OK)
  start(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.rentals.start(id, userId);
  }

  @Post('bookings/:id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.rentals.complete(id, userId);
  }
}
