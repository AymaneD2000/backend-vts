import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DriversService } from '../drivers/drivers.service';
import { RidesService } from '../rides/rides.service';
import { RideOfferedEvent, RideTakenEvent, RideUpdatedEvent } from '../rides/ride-events';
interface AuthedSocket extends Socket {
    userId?: string;
}
export declare class RealtimeGateway implements OnGatewayConnection {
    private readonly jwt;
    private readonly config;
    private readonly drivers;
    private readonly rides;
    private readonly logger;
    server: Server;
    constructor(jwt: JwtService, config: ConfigService, drivers: DriversService, rides: RidesService);
    handleConnection(client: AuthedSocket): Promise<void>;
    onDriverLocation(client: AuthedSocket, body: {
        lat: number;
        lng: number;
    }): Promise<void>;
    handleRideUpdated(event: RideUpdatedEvent): void;
    handleRideOffered(event: RideOfferedEvent): void;
    handleRideTaken(event: RideTakenEvent): void;
}
export {};
