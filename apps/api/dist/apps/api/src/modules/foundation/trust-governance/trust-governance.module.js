"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustGovernanceModule = void 0;
const common_1 = require("@nestjs/common");
const trust_governance_controller_1 = require("./trust-governance.controller");
const trust_governance_service_1 = require("./trust-governance.service");
let TrustGovernanceModule = class TrustGovernanceModule {
};
exports.TrustGovernanceModule = TrustGovernanceModule;
exports.TrustGovernanceModule = TrustGovernanceModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [trust_governance_controller_1.TrustGovernanceController],
        providers: [trust_governance_service_1.TrustGovernanceService],
        exports: [trust_governance_service_1.TrustGovernanceService]
    })
], TrustGovernanceModule);
//# sourceMappingURL=trust-governance.module.js.map