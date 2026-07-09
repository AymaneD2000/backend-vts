import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverProfile } from '../users/entities/driver-profile.entity';
import { Ride, RideStatus } from '../rides/entities/ride.entity';
import {
  RentalBooking,
  RentalStatus,
} from '../rentals/entities/rental-booking.entity';
import { Rating } from './entities/rating.entity';
import { RentalRating } from './entities/rental-rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private readonly ratings: Repository<Rating>,
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
    @InjectRepository(RentalRating)
    private readonly rentalRatings: Repository<RentalRating>,
    @InjectRepository(RentalBooking)
    private readonly bookings: Repository<RentalBooking>,
    @InjectRepository(DriverProfile)
    private readonly profiles: Repository<DriverProfile>,
  ) {}

  async rate(
    rideId: string,
    raterId: string,
    score: number,
    comment?: string,
  ): Promise<Rating> {
    const ride = await this.rides.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');

    // Only a participant of the trip can rate, and only once it is over.
    const isClient = ride.clientId === raterId;
    const isDriver = ride.driverId === raterId;
    if (!isClient && !isDriver) {
      throw new ForbiddenException('Not your ride');
    }
    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Can only rate a completed ride');
    }

    const rateeId = isClient ? ride.driverId : ride.clientId;
    if (!rateeId) {
      throw new BadRequestException('Ride has no counterpart to rate');
    }

    const existing = await this.ratings.findOne({
      where: { rideId, raterId },
    });
    if (existing) {
      throw new ConflictException('You already rated this ride');
    }

    const rating = await this.ratings.save(
      this.ratings.create({ rideId, raterId, rateeId, score, comment }),
    );

    // Keep the driver's average rating in sync for matching/listings.
    if (isClient) {
      await this.recomputeDriverAverage(rateeId);
    }
    return rating;
  }

  // Has this user already rated this ride? Lets the app hide the rating UI.
  async mine(rideId: string, raterId: string): Promise<Rating | null> {
    return this.ratings.findOne({ where: { rideId, raterId } });
  }

  // --- Rentals ---

  async rateRental(
    bookingId: string,
    raterId: string,
    score: number,
    comment?: string,
  ): Promise<RentalRating> {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const isClient = booking.clientId === raterId;
    const isDriver = booking.driverId === raterId;
    if (!isClient && !isDriver) {
      throw new ForbiddenException('Not your booking');
    }
    if (booking.status !== RentalStatus.COMPLETED) {
      throw new BadRequestException('Can only rate a completed rental');
    }

    const rateeId = isClient ? booking.driverId : booking.clientId;
    if (!rateeId) {
      throw new BadRequestException('Booking has no counterpart to rate');
    }

    const existing = await this.rentalRatings.findOne({
      where: { rentalBookingId: bookingId, raterId },
    });
    if (existing) {
      throw new ConflictException('You already rated this rental');
    }

    const rating = await this.rentalRatings.save(
      this.rentalRatings.create({
        rentalBookingId: bookingId,
        raterId,
        rateeId,
        score,
        comment,
      }),
    );

    // Keep the driver's average rating in sync for matching/listings.
    if (isClient) {
      await this.recomputeDriverAverage(rateeId);
    }
    return rating;
  }

  async myRentalRating(
    bookingId: string,
    raterId: string,
  ): Promise<RentalRating | null> {
    return this.rentalRatings.findOne({
      where: { rentalBookingId: bookingId, raterId },
    });
  }

  // A driver's average spans both ride and rental ratings, so aggregate both.
  private async recomputeDriverAverage(driverId: string): Promise<void> {
    const ride = await this.ratings
      .createQueryBuilder('r')
      .select('SUM(r.score)', 'sum')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.ratee_id = :driverId', { driverId })
      .getRawOne<{ sum: string | null; count: string }>();
    const rental = await this.rentalRatings
      .createQueryBuilder('r')
      .select('SUM(r.score)', 'sum')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.ratee_id = :driverId', { driverId })
      .getRawOne<{ sum: string | null; count: string }>();

    const sum =
      parseFloat(ride?.sum ?? '0') + parseFloat(rental?.sum ?? '0');
    const count =
      parseInt(ride?.count ?? '0', 10) + parseInt(rental?.count ?? '0', 10);
    const ratingAvg = count > 0 ? Number((sum / count).toFixed(2)) : 0;
    await this.profiles.update({ userId: driverId }, { ratingAvg });
  }
}
