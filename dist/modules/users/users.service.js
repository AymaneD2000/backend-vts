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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(users) {
        this.users = users;
    }
    findByPhone(phone) {
        return this.users.findOne({ where: { phone } });
    }
    findById(id) {
        return this.users.findOne({ where: { id } });
    }
    async createWithPhone(phone, roles = [user_entity_1.UserRole.CLIENT]) {
        const user = this.users.create({ phone, roles });
        return this.users.save(user);
    }
    async findOrCreateByPhone(phone) {
        const existing = await this.findByPhone(phone);
        if (existing)
            return existing;
        return this.createWithPhone(phone);
    }
    async markPhoneVerified(id) {
        await this.users.update({ id }, { phoneVerified: true });
    }
    async addRole(user, role) {
        if (user.roles.includes(role))
            return user;
        user.roles = [...user.roles, role];
        return this.users.save(user);
    }
    async setRefreshTokenHash(id, hash) {
        await this.users.update({ id }, { refreshTokenHash: hash ?? undefined });
    }
    async getRefreshTokenHash(id) {
        const user = await this.users.findOne({
            where: { id },
            select: { id: true, refreshTokenHash: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user.refreshTokenHash ?? null;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map