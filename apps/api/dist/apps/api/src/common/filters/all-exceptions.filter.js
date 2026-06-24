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
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const request_governance_service_1 = require("../governance/request-governance.service");
let AllExceptionsFilter = class AllExceptionsFilter {
    requestGovernanceService;
    constructor(requestGovernanceService) {
        this.requestGovernanceService = requestGovernanceService;
    }
    catch(exception, host) {
        if (host.getType() !== 'http') {
            return;
        }
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof Error ? exception.message : 'Internal server error';
        this.requestGovernanceService.recordRequestFailure(request, status, message, exception instanceof Error ? exception.name : 'UnhandledException');
        response.status(status).json({
            success: false,
            message,
            data: null,
            timestamp: new Date().toISOString()
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [request_governance_service_1.RequestGovernanceService])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map