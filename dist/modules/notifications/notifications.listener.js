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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const rental_booking_entity_1 = require("../rentals/entities/rental-booking.entity");
const rental_events_1 = require("../rentals/rental-events");
const ride_entity_1 = require("../rides/entities/ride.entity");
const ride_events_1 = require("../rides/ride-events");
const notifications_service_1 = require("./notifications.service");
let NotificationsListener = class NotificationsListener {
    constructor(notifications) {
        this.notifications = notifications;
    }
    async handleRideOffered(event) {
        const { ride, driverIds } = event;
        await this.notifications.sendToUsers(driverIds, {
            title: 'Nouvelle course',
            body: ride.pickupAddress
                ? `Prise en charge: ${ride.pickupAddress}`
                : 'Une nouvelle course est disponible.',
            data: { type: 'ride_offer', rideId: ride.id },
        });
    }
    async handleRideUpdated(event) {
        const { ride } = event;
        const message = this.clientMessage(ride);
        if (!message)
            return;
        await this.notifications.sendToUser(ride.clientId, {
            title: message.title,
            body: message.body,
            data: { type: 'ride_update', rideId: ride.id, status: ride.status },
        });
    }
    clientMessage(ride) {
        switch (ride.status) {
            case ride_entity_1.RideStatus.ACCEPTED:
                return {
                    title: 'Chauffeur en route',
                    body: 'Un chauffeur a accepté votre course et arrive.',
                };
            case ride_entity_1.RideStatus.IN_PROGRESS:
                return { title: 'Course démarrée', body: 'Votre trajet a commencé.' };
            case ride_entity_1.RideStatus.COMPLETED:
                return {
                    title: 'Course terminée',
                    body: `Merci ! Montant: ${ride.fareAmount} ${ride.currency}.`,
                };
            case ride_entity_1.RideStatus.CANCELLED:
                return { title: 'Course annulée', body: 'Votre course a été annulée.' };
            case ride_entity_1.RideStatus.NO_DRIVER:
                return {
                    title: 'Aucun chauffeur',
                    body: 'Aucun chauffeur disponible pour le moment.',
                };
            default:
                return null;
        }
    }
    async handleRentalUpdated(event) {
        const { booking } = event;
        const message = this.rentalMessage(booking);
        if (!message)
            return;
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
    rentalMessage(booking) {
        switch (booking.status) {
            case rental_booking_entity_1.RentalStatus.ACCEPTED:
                return {
                    title: 'Location acceptée',
                    body: `Un chauffeur a accepté votre location de ${booking.vehicleName}.`,
                };
            case rental_booking_entity_1.RentalStatus.IN_PROGRESS:
                return {
                    title: 'Location démarrée',
                    body: `Votre location de ${booking.vehicleName} a commencé.`,
                };
            case rental_booking_entity_1.RentalStatus.COMPLETED:
                return {
                    title: 'Location terminée',
                    body: `Merci ! Montant: ${booking.totalAmount} ${booking.currency}.`,
                };
            case rental_booking_entity_1.RentalStatus.CANCELLED:
                return {
                    title: 'Location annulée',
                    body: 'Votre location a été annulée.',
                };
            default:
                return null;
        }
    }
};
exports.NotificationsListener = NotificationsListener;
__decorate([
    (0, event_emitter_1.OnEvent)(ride_events_1.RIDE_OFFERED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleRideOffered", null);
__decorate([
    (0, event_emitter_1.OnEvent)(ride_events_1.RIDE_UPDATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleRideUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(rental_events_1.RENTAL_UPDATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleRentalUpdated", null);
exports.NotificationsListener = NotificationsListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsListener);
//# sourceMappingURL=notifications.listener.js.map