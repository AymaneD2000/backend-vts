import { LatLng } from '../../common/geo';
export interface RouteResult {
    distanceM: number;
    durationS?: number;
}
export declare class RoutingService {
    private readonly logger;
    route(from: LatLng, to: LatLng): Promise<RouteResult>;
    private fallback;
}
