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
exports.TrafficGovernanceGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const request_governance_decorator_1 = require("../governance/request-governance.decorator");
const request_governance_service_1 = require("../governance/request-governance.service");
let TrafficGovernanceGuard = class TrafficGovernanceGuard {
    reflector;
    requestGovernanceService;
    constructor(reflector, requestGovernanceService) {
        this.reflector = reflector;
        this.requestGovernanceService = requestGovernanceService;
    }
    async canActivate(context) {
        if (context.getType() !== 'http') {
            return true;
        }
        const metadata = this.reflector.getAllAndOverride(request_governance_decorator_1.RATE_LIMIT_METADATA_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (!metadata) {
            return true;
        }
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        const decision = await this.requestGovernanceService.evaluateRateLimit(req, metadata);
        this.requestGovernanceService.applyRateLimitHeaders(res, decision);
        if (!decision.allowed) {
            throw new common_1.HttpException(`Rate limit exceeded for ${decision.scopeKey}`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
};
exports.TrafficGovernanceGuard = TrafficGovernanceGuard;
exports.TrafficGovernanceGuard = TrafficGovernanceGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        request_governance_service_1.RequestGovernanceService])
], TrafficGovernanceGuard);
//# sourceMappingURL=traffic-governance.guard.js.map