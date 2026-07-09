import { RentalUpdatedEvent } from '../rentals/rental-events';
import { RideOfferedEvent, RideUpdatedEvent } from '../rides/ride-events';
import { NotificationsService } from './notifications.service';
export declare class NotificationsListener {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    handleRideOffered(event: RideOfferedEvent): Promise<void>;
    handleRideUpdated(event: RideUpdatedEvent): Promise<void>;
    private clientMessage;
    handleRentalUpdated(event: RentalUpdatedEvent): Promise<void>;
    private rentalMessage;
}
