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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_type_1 = require("../../common/service-type");
const rides_service_1 = require("../rides/rides.service");
const user_entity_1 = require("../users/entities/user.entity");
const merchant_entity_1 = require("./entities/merchant.entity");
let MerchantsService = class MerchantsService {
    constructor(merchants, users, rides) {
        this.merchants = merchants;
        this.users = users;
        this.rides = rides;
    }
    async create(dto) {
        const merchant = await this.merchants.save(this.merchants.create(dto));
        if (merchant.ownerUserId) {
            await this.grantMerchantRole(merchant.ownerUserId);
        }
        return merchant;
    }
    list() {
        return this.merchants.find({ order: { createdAt: 'DESC' } });
    }
    async update(id, dto) {
        const merchant = await this.merchants.findOne({ where: { id } });
        if (!merchant)
            throw new common_1.NotFoundException('Merchant not found');
        Object.assign(merchant, dto);
        const saved = await this.merchants.save(merchant);
        if (saved.ownerUserId) {
            await this.grantMerchantRole(saved.ownerUserId);
        }
        return saved;
    }
    myMerchants(userId) {
        return this.merchants.find({
            where: { ownerUserId: userId },
            order: { createdAt: 'DESC' },
        });
    }
    async createDelivery(userId, dto) {
        const merchant = await this.merchants.findOne({
            where: { id: dto.merchantId, ownerUserId: userId },
        });
        if (!merchant)
            throw new common_1.NotFoundException('Merchant not found');
        if (merchant.status !== merchant_entity_1.MerchantStatus.ACTIVE) {
            throw new common_1.ForbiddenException('Merchant is not active');
        }
        if (merchant.lat == null || merchant.lng == null) {
            throw new common_1.BadRequestException('Merchant has no location set');
        }
        const dropoffAddress = [dto.customerAddress, dto.customerName, dto.customerPhone]
            .filter(Boolean)
            .join(' · ');
        const rideDto = {
            serviceType: service_type_1.ServiceType.MERCHANT_DELIVERY,
            pickup: { lat: merchant.lat, lng: merchant.lng, address: merchant.address },
            dropoff: {
                lat: dto.customerLat,
                lng: dto.customerLng,
                address: dropoffAddress || undefined,
            },
            paymentMethod: dto.paymentMethod,
        };
        return this.rides.request(userId, rideDto, {
            merchantId: merchant.id,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
            recipientName: dto.customerName,
            recipientPhone: dto.customerPhone,
            parcelDescription: dto.note,
        });
    }
    async myDeliveries(userId) {
        const mine = await this.myMerchants(userId);
        return this.rides.findByMerchantIds(mine.map((m) => m.id));
    }
    async dispatchDelivery(userId, rideId) {
        const delivery = await this.rides.findMerchantDelivery(rideId);
        const merchant = await this.merchants.findOne({
            where: { id: delivery.merchantId, ownerUserId: userId },
        });
        if (!merchant)
            throw new common_1.NotFoundException('Delivery not found');
        return this.rides.dispatchScheduled(rideId);
    }
    async grantMerchantRole(userId) {
        const user = await this.users.findOne({ where: { id: userId } });
        if (!user)
            return;
        if (!user.roles.includes(user_entity_1.UserRole.MERCHANT)) {
            user.roles = [...user.roles, user_entity_1.UserRole.MERCHANT];
            await this.users.save(user);
        }
    }
};
exports.MerchantsService = MerchantsService;
exports.MerchantsService = MerchantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(merchant_entity_1.Merchant)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        rides_service_1.RidesService])
], MerchantsService);
//# sourceMappingURL=merchants.service.js.map