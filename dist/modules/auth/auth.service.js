"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const argon2 = __importStar(require("argon2"));
const user_entity_1 = require("../users/entities/user.entity");
const users_service_1 = require("../users/users.service");
const otp_service_1 = require("./otp/otp.service");
let AuthService = class AuthService {
    constructor(users, otp, jwt, config) {
        this.users = users;
        this.otp = otp;
        this.jwt = jwt;
        this.config = config;
    }
    async requestOtp(phone, email) {
        const identity = this.resolveIdentity(phone, email);
        if (identity.channel === 'email') {
            await this.users.findOrCreateByEmail(identity.value);
        }
        else {
            await this.users.findOrCreateByPhone(identity.value);
        }
        await this.otp.requestOtp(identity.value, identity.channel);
    }
    async verifyOtp(phone, email, code) {
        const identity = this.resolveIdentity(phone, email);
        const ok = await this.otp.verifyOtp(identity.value, identity.channel, code);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid or expired code');
        let user = identity.channel === 'email'
            ? await this.users.findByEmail(identity.value)
            : await this.users.findByPhone(identity.value);
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        if (identity.channel === 'email' && !user.emailVerified) {
            await this.users.markEmailVerified(user.id);
        }
        else if (identity.channel === 'phone' && !user.phoneVerified) {
            await this.users.markPhoneVerified(user.id);
        }
        const adminPhones = this.config.get('admin.phones') ?? [];
        const adminEmails = this.config.get('admin.emails') ?? [];
        if ((user.phone && adminPhones.includes(user.phone)) ||
            (user.email && adminEmails.includes(user.email))) {
            user = await this.users.addRole(user, user_entity_1.UserRole.ADMIN);
        }
        return this.issueTokens(user);
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.get('jwt.refreshSecret'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const storedHash = await this.users.getRefreshTokenHash(payload.sub);
        if (!storedHash || !(await argon2.verify(storedHash, refreshToken))) {
            throw new common_1.UnauthorizedException('Refresh token revoked');
        }
        const user = await this.users.findById(payload.sub);
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return this.issueTokens(user);
    }
    async logout(userId) {
        await this.users.setRefreshTokenHash(userId, null);
    }
    async issueTokens(user) {
        const payload = {
            sub: user.id,
            phone: user.phone,
            email: user.email,
            roles: user.roles,
        };
        const accessToken = await this.jwt.signAsync(payload, {
            secret: this.config.get('jwt.accessSecret'),
            expiresIn: this.config.get('jwt.accessTtl'),
        });
        const refreshToken = await this.jwt.signAsync(payload, {
            secret: this.config.get('jwt.refreshSecret'),
            expiresIn: this.config.get('jwt.refreshTtl'),
        });
        const refreshHash = await argon2.hash(refreshToken);
        await this.users.setRefreshTokenHash(user.id, refreshHash);
        return { accessToken, refreshToken };
    }
    resolveIdentity(phone, email) {
        if ((!phone && !email) || (phone && email)) {
            throw new common_1.BadRequestException('Provide either phone or email');
        }
        if (email) {
            return { channel: 'email', value: email.trim().toLowerCase() };
        }
        return { channel: 'phone', value: phone };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        otp_service_1.OtpService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map