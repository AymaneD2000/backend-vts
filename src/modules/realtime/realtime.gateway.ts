import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DriversService } from '../drivers/drivers.service';
import { RidesService } from '../rides/rides.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import {
  RIDE_OFFERED,
  RIDE_TAKEN,
  RIDE_UPDATED,
  RideOfferedEvent,
  RideTakenEvent,
  RideUpdatedEvent,
} from '../rides/ride-events';

interface AuthedSocket extends Socket {
  userId?: string;
}

// Real-time channel for live driver positions and ride status updates.
// Clients authenticate by passing their JWT access token in the handshake
// (auth.token or ?token=). Each user joins a room named by their userId so
// the server can target them directly.
@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly drivers: DriversService,
    private readonly rides: RidesService,
  ) {}

  async handleConnection(client: AuthedSocket): Promise<void> {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string);
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      client.userId = payload.sub;
      client.join(payload.sub);
    } catch {
      this.logger.warn('Rejected socket: invalid token');
      client.disconnect(true);
    }
  }

  // Driver app pushes its GPS position; we update the geo index and relay the
  // position to the client tracking the driver's active ride.
  @SubscribeMessage('driver:location')
  async onDriverLocation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { lat: number; lng: number },
  ): Promise<void> {
    if (!client.userId) return;
    try {
      await this.drivers.updateLocation(client.userId, {
        lat: body.lat,
        lng: body.lng,
      });
    } catch {
      return; // driver offline; ignore
    }
    const ride = await this.rides.getActiveRideForDriver(client.userId);
    if (ride) {
      this.server.to(ride.clientId).emit('driver:location', {
        rideId: ride.id,
        lat: body.lat,
        lng: body.lng,
      });
    }
  }

  @OnEvent(RIDE_UPDATED)
  handleRideUpdated(event: RideUpdatedEvent): void {
    const { ride } = event;
    this.server.to(ride.clientId).emit('ride:update', ride);
    if (ride.driverId) {
      this.server.to(ride.driverId).emit('ride:update', ride);
    }
  }

  // A pending ride is offered to nearby drivers; push it to each one's socket.
  @OnEvent(RIDE_OFFERED)
  handleRideOffered(event: RideOfferedEvent): void {
    for (const driverId of event.driverIds) {
      this.server.to(driverId).emit('ride:offer', event.ride);
    }
  }

  // An offer is no longer available; tell those drivers to drop it.
  @OnEvent(RIDE_TAKEN)
  handleRideTaken(event: RideTakenEvent): void {
    for (const driverId of event.driverIds) {
      this.server.to(driverId).emit('ride:taken', { rideId: event.rideId });
    }
  }
}
