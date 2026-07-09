"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RoutingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingService = void 0;
const common_1 = require("@nestjs/common");
const geo_1 = require("../../common/geo");
const OSRM_BASE_URL = 'https://router.project-osrm.org';
const REQUEST_TIMEOUT_MS = 4000;
let RoutingService = RoutingService_1 = class RoutingService {
    constructor() {
        this.logger = new common_1.Logger(RoutingService_1.name);
    }
    async route(from, to) {
        const url = `${OSRM_BASE_URL}/route/v1/driving/` +
            `${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok)
                return this.fallback(from, to);
            const body = (await res.json());
            const route = body.routes?.[0];
            if (!route)
                return this.fallback(from, to);
            return {
                distanceM: Math.round(route.distance),
                durationS: Math.round(route.duration),
            };
        }
        catch {
            this.logger.warn('OSRM routing failed; using straight-line distance');
            return this.fallback(from, to);
        }
        finally {
            clearTimeout(timeout);
        }
    }
    fallback(from, to) {
        return { distanceM: Math.round((0, geo_1.haversineMeters)(from, to)) };
    }
};
exports.RoutingService = RoutingService;
exports.RoutingService = RoutingService = RoutingService_1 = __decorate([
    (0, common_1.Injectable)()
], RoutingService);
//# sourceMappingURL=routing.service.js.map