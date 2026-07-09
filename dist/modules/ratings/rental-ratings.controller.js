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
exports.RentalRatingsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const rate_dto_1 = require("./dto/rate.dto");
const ratings_service_1 = require("./ratings.service");
let RentalRatingsController = class RentalRatingsController {
    constructor(ratings) {
        this.ratings = ratings;
    }
    rate(userId, bookingId, dto) {
        return this.ratings.rateRental(bookingId, userId, dto.score, dto.comment);
    }
    mine(userId, bookingId) {
        return this.ratings.myRentalRating(bookingId, userId);
    }
};
exports.RentalRatingsController = RentalRatingsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('bookingId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, rate_dto_1.RateDto]),
    __metadata("design:returntype", void 0)
], RentalRatingsController.prototype, "rate", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RentalRatingsController.prototype, "mine", null);
exports.RentalRatingsController = RentalRatingsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('rentals/bookings/:bookingId/rating'),
    __metadata("design:paramtypes", [ratings_service_1.RatingsService])
], RentalRatingsController);
//# sourceMappingURL=rental-ratings.controller.js.map