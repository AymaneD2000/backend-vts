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
exports.KycDocument = exports.KycDocumentType = void 0;
const typeorm_1 = require("typeorm");
var KycDocumentType;
(function (KycDocumentType) {
    KycDocumentType["ID_CARD"] = "id_card";
    KycDocumentType["DRIVER_LICENSE"] = "driver_license";
    KycDocumentType["VEHICLE_REGISTRATION"] = "vehicle_registration";
    KycDocumentType["PROFILE_PHOTO"] = "profile_photo";
    KycDocumentType["VEHICLE_PHOTO"] = "vehicle_photo";
})(KycDocumentType || (exports.KycDocumentType = KycDocumentType = {}));
let KycDocument = class KycDocument {
};
exports.KycDocument = KycDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], KycDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], KycDocument.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: KycDocumentType }),
    __metadata("design:type", String)
], KycDocument.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_path' }),
    __metadata("design:type", String)
], KycDocument.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'original_name' }),
    __metadata("design:type", String)
], KycDocument.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type' }),
    __metadata("design:type", String)
], KycDocument.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], KycDocument.prototype, "createdAt", void 0);
exports.KycDocument = KycDocument = __decorate([
    (0, typeorm_1.Entity)('kyc_documents'),
    (0, typeorm_1.Index)(['userId', 'type'], { unique: true })
], KycDocument);
//# sourceMappingURL=kyc-document.entity.js.map