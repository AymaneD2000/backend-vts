"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const drivers_service_1 = require("../drivers/drivers.service");
const rides_service_1 = require("../rides/rides.service");
const ride_events_1 = require("../rides/ride-events");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    constructor(jwt, config, drivers, rides) {
        this.jwt = jwt;
        this.config = config;
        this.drivers = drivers;
        this.rides = rides;
        this.logger = new common_1.Logger(RealtimeGateway_1.name);
    }
    async handleConnection(client) {
        const token = client.handshake.auth?.token ||
            client.handshake.query?.token;
        try {
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.get('jwt.accessSecret'),
            });
            client.userId = payload.sub;
            client.join(payload.sub);
        }
        catch {
            this.logger.warn('Rejected socket: invalid token');
            client.disconnect(true);
        }
    }
    async onDriverLocation(client, body) {
        if (!client.userId)
            return;
        try {
            await this.drivers.updateLocation(client.userId, {
                lat: body.lat,
                lng: body.lng,
            });
        }
        catch {
            return;
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
    handleRideUpdated(event) {
        const { ride } = event;
        this.server.to(ride.clientId).emit('ride:update', ride);
        if (ride.driverId) {
            this.server.to(ride.driverId).emit('ride:update', ride);
        }
    }
    handleRideOffered(event) {
        for (const driverId of event.driverIds) {
            this.server.to(driverId).emit('ride:offer', event.ride);
        }
    }
    handleRideTaken(event) {
        for (const driverId of event.driverIds) {
            this.server.to(driverId).emit('ride:taken', { rideId: event.rideId });
        }
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('driver:location'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "onDriverLocation", null);
__decorate([
    (0, event_emitter_1.OnEvent)(ride_events_1.RIDE_UPDATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleRideUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(ride_events_1.RIDE_OFFERED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleRideOffered", null);
__decorate([
    (0, event_emitter_1.OnEvent)(ride_events_1.RIDE_TAKEN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleRideTaken", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        drivers_service_1.DriversService,
        rides_service_1.RidesService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map