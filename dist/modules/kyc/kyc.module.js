"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycModule = void 0;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const platform_express_1 = require("@nestjs/platform-express");
const typeorm_1 = require("@nestjs/typeorm");
const multer_1 = require("multer");
const path_1 = require("path");
const driver_profile_entity_1 = require("../users/entities/driver-profile.entity");
const users_module_1 = require("../users/users.module");
const kyc_document_entity_1 = require("./entities/kyc-document.entity");
const kyc_controller_1 = require("./kyc.controller");
const kyc_service_1 = require("./kyc.service");
let KycModule = class KycModule {
};
exports.KycModule = KycModule;
exports.KycModule = KycModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            typeorm_1.TypeOrmModule.forFeature([kyc_document_entity_1.KycDocument, driver_profile_entity_1.DriverProfile]),
            platform_express_1.MulterModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const uploadDir = (0, path_1.resolve)(config.get('kyc.uploadDir') ?? 'uploads/kyc');
                    (0, fs_1.mkdirSync)(uploadDir, { recursive: true });
                    return {
                        storage: (0, multer_1.diskStorage)({
                            destination: uploadDir,
                            filename: (_req, file, cb) => {
                                cb(null, `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname)}`);
                            },
                        }),
                    };
                },
            }),
        ],
        controllers: [kyc_controller_1.KycController],
        providers: [kyc_service_1.KycService],
        exports: [kyc_service_1.KycService],
    })
], KycModule);
//# sourceMappingURL=kyc.module.js.map