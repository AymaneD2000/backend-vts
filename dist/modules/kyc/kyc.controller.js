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
exports.KycController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const fs_1 = require("fs");
const current_user_decorator_1 = require("../../common/current-user.decorator");
const roles_decorator_1 = require("../../common/roles.decorator");
const roles_guard_1 = require("../../common/roles.guard");
const user_entity_1 = require("../users/entities/user.entity");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const review_kyc_dto_1 = require("./dto/review-kyc.dto");
const update_driver_profile_dto_1 = require("./dto/update-driver-profile.dto");
const upload_document_dto_1 = require("./dto/upload-document.dto");
const kyc_service_1 = require("./kyc.service");
let KycController = class KycController {
    constructor(kyc) {
        this.kyc = kyc;
    }
    status(userId) {
        return this.kyc.getStatus(userId);
    }
    updateProfile(userId, dto) {
        return this.kyc.updateProfile(userId, dto);
    }
    async upload(userId, dto, file) {
        const doc = await this.kyc.saveDocument(userId, dto.type, file);
        return { id: doc.id, type: doc.type, originalName: doc.originalName };
    }
    submit(userId) {
        return this.kyc.submit(userId);
    }
    listPending() {
        return this.kyc.listPending();
    }
    listUserDocuments(userId) {
        return this.kyc.listDocumentsFor(userId);
    }
    review(userId, dto) {
        return this.kyc.review(userId, dto.approve, dto.reason);
    }
    async file(user, id, res) {
        const isAdmin = user.roles.includes(user_entity_1.UserRole.ADMIN);
        const { path, mimeType, originalName } = await this.kyc.getDocumentFile(id, user.userId, isAdmin);
        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${originalName}"`,
        });
        return new common_1.StreamableFile((0, fs_1.createReadStream)(path));
    }
};
exports.KycController = KycController;
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "status", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_driver_profile_dto_1.UpdateDriverProfileDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [new common_1.MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upload_document_dto_1.UploadDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)('submit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KycController.prototype, "listPending", null);
__decorate([
    (0, common_1.Get)('users/:userId/documents'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "listUserDocuments", null);
__decorate([
    (0, common_1.Post)('review/:userId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_kyc_dto_1.ReviewKycDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "review", null);
__decorate([
    (0, common_1.Get)('documents/:id/file'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "file", null);
exports.KycController = KycController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('kyc'),
    __metadata("design:paramtypes", [kyc_service_1.KycService])
], KycController);
//# sourceMappingURL=kyc.controller.js.map