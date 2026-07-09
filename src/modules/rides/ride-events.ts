import { VehicleType } from '../users/entities/driver-profile.entity';
import { Ride } from './entities/ride.entity';

// Emitted whenever a ride changes state; the realtime gateway forwards it to
// the involved client and driver sockets.
export const RIDE_UPDATED = 'ride.updated';

export interface RideUpdatedEvent {
  ride: Ride;
}

// A pending ride is offered to one or more nearby online drivers. The gateway
// pushes it to each driver's socket so they can accept it.
export const RIDE_OFFERED = 'ride.offered';

export interface RideOfferedEvent {
  ride: Ride;
  driverIds: string[];
}

// A pending ride is no longer available to these drivers (another driver took
// it, or the client cancelled). The gateway tells them to drop the offer.
export const RIDE_TAKEN = 'ride.taken';

export interface RideTakenEvent {
  rideId: string;
  driverIds: string[];
}

// A driver just came online; the dispatcher checks for pending rides it can
// fulfil and offers them.
export const DRIVER_ONLINE = 'driver.online';

export interface DriverOnlineEvent {
  driverId: string;
  vehicleType: VehicleType;
  lat: number;
  lng: number;
}
