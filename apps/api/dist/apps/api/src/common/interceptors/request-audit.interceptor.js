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
exports.RequestAuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const request_governance_service_1 = require("../governance/request-governance.service");
let RequestAuditInterceptor = class RequestAuditInterceptor {
    requestGovernanceService;
    constructor(requestGovernanceService) {
        this.requestGovernanceService = requestGovernanceService;
    }
    intercept(context, next) {
        if (context.getType() !== 'http') {
            return next.handle();
        }
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        this.requestGovernanceService.ensureRequestContext(req);
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                this.requestGovernanceService.recordRequestSuccess(req, res);
            }
        }));
    }
};
exports.RequestAuditInterceptor = RequestAuditInterceptor;
exports.RequestAuditInterceptor = RequestAuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [request_governance_service_1.RequestGovernanceService])
], RequestAuditInterceptor);
//# sourceMappingURL=request-audit.interceptor.js.map