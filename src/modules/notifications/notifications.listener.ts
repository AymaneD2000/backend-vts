import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  RentalBooking,
  RentalStatus,
} from '../rentals/entities/rental-booking.entity';
import { RENTAL_UPDATED, RentalUpdatedEvent } from '../rentals/rental-events';
import { Ride, RideStatus } from '../rides/entities/ride.entity';
import {
  RIDE_OFFERED,
  RIDE_UPDATED,
  RideOfferedEvent,
  RideUpdatedEvent,
} from '../rides/ride-events';
import { NotificationsService } from './notifications.service';

// Bridges ride domain events to push notifications so users are reached even
// when the app is backgrounded (the WebSocket only covers foreground).
@Injectable()
export class NotificationsListener {
  constructor(private readonly notifications: NotificationsService) {}

  // A pending ride was broadcast to nearby drivers: ping each one.
  @OnEvent(RIDE_OFFERED)
  async handleRideOffered(event: RideOfferedEvent): Promise<void> {
    const { ride, driverIds } = event;
    await this.notifications.sendToUsers(driverIds, {
      title: 'Nouvelle course',
      body: ride.pickupAddress
        ? `Prise en charge: ${ride.pickupAddress}`
        : 'Une nouvelle course est disponible.',
      data: { type: 'ride_offer', rideId: ride.id },
    });
  }

  // Notify the client when their ride changes to a state they care about.
  @OnEvent(RIDE_UPDATED)
  async handleRideUpdated(event: RideUpdatedEvent): Promise<void> {
    const { ride } = event;
    const message = this.clientMessage(ride);
    if (!message) return;
    await this.notifications.sendToUser(ride.clientId, {
      title: message.title,
      body: message.body,
      data: { type: 'ride_update', rideId: ride.id, status: ride.status },
    });
  }

  private clientMessage(
    ride: Ride,
  ): { title: string; body: string } | null {
    switch (ride.status) {
      case RideStatus.ACCEPTED:
        return {
          title: 'Chauffeur en route',
          body: 'Un chauffeur a accepté votre course et arrive.',
        };
      case RideStatus.IN_PROGRESS:
        return { title: 'Course démarrée', body: 'Votre trajet a commencé.' };
      case RideStatus.COMPLETED:
        return {
          title: 'Course terminée',
          body: `Merci ! Montant: ${ride.fareAmount} ${ride.currency}.`,
        };
      case RideStatus.CANCELLED:
        return { title: 'Course annulée', body: 'Votre course a été annulée.' };
      case RideStatus.NO_DRIVER:
        return {
          title: 'Aucun chauffeur',
          body: 'Aucun chauffeur disponible pour le moment.',
        };
      default:
        return null;
    }
  }

  // Notify the client when their rental booking changes to a notable state.
  @OnEvent(RENTAL_UPDATED)
  async handleRentalUpdated(event: RentalUpdatedEvent): Promise<void> {
    const { booking } = event;
    const message = this.rentalMessage(booking);
    if (!message) return;
    await this.notifications.sendToUser(booking.clientId, {
      title: message.title,
      body: message.body,
      data: {
        type: 'rental_update',
        bookingId: booking.id,
        status: booking.status,
      },
    });
  }

  private rentalMessage(
    booking: RentalBooking,
  ): { title: string; body: string } | null {
    switch (booking.status) {
      case RentalStatus.ACCEPTED:
        return {
          title: 'Location acceptée',
          body: `Un chauffeur a accepté votre location de ${booking.vehicleName}.`,
        };
      case RentalStatus.IN_PROGRESS:
        return {
          title: 'Location démarrée',
          body: `Votre location de ${booking.vehicleName} a commencé.`,
        };
      case RentalStatus.COMPLETED:
        return {
          title: 'Location terminée',
          body: `Merci ! Montant: ${booking.totalAmount} ${booking.currency}.`,
        };
      case RentalStatus.CANCELLED:
        return {
          title: 'Location annulée',
          body: 'Votre location a été annulée.',
        };
      default:
        return null;
    }
  }
}
