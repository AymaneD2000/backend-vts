import { CancelRideDto } from './dto/cancel-ride.dto';
import { RequestRideDto } from './dto/request-ride.dto';
import { RidesService } from './rides.service';
export declare class RidesController {
    private readonly rides;
    constructor(rides: RidesService);
    request(userId: string, dto: RequestRideDto): Promise<import("./entities/ride.entity").Ride>;
    list(userId: string): Promise<import("./entities/ride.entity").Ride[]>;
    get(userId: string, id: string): Promise<import("./entities/ride.entity").Ride>;
    accept(userId: string, id: string): Promise<import("./entities/ride.entity").Ride>;
    start(userId: string, id: string): Promise<import("./entities/ride.entity").Ride>;
    complete(userId: string, id: string): Promise<import("./entities/ride.entity").Ride>;
    cancel(userId: string, id: string, dto: CancelRideDto): Promise<import("./entities/ride.entity").Ride>;
}
