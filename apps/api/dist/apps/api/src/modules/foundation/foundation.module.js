"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoundationModule = void 0;
const common_1 = require("@nestjs/common");
const configuration_governance_module_1 = require("./configuration-governance/configuration-governance.module");
const governance_approval_module_1 = require("./governance-approval/governance-approval.module");
const foundation_controller_1 = require("./foundation.controller");
const foundation_service_1 = require("./foundation.service");
const identity_access_module_1 = require("./identity-access/identity-access.module");
const integration_orchestration_module_1 = require("./integration-orchestration/integration-orchestration.module");
const resilience_operations_module_1 = require("./resilience-operations/resilience-operations.module");
const runtime_governance_module_1 = require("./runtime-governance/runtime-governance.module");
const trust_governance_module_1 = require("./trust-governance/trust-governance.module");
let FoundationModule = class FoundationModule {
};
exports.FoundationModule = FoundationModule;
exports.FoundationModule = FoundationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            identity_access_module_1.IdentityAccessModule,
            configuration_governance_module_1.ConfigurationGovernanceModule,
            integration_orchestration_module_1.IntegrationOrchestrationModule,
            trust_governance_module_1.TrustGovernanceModule,
            resilience_operations_module_1.ResilienceOperationsModule,
            runtime_governance_module_1.RuntimeGovernanceModule,
            governance_approval_module_1.GovernanceApprovalModule
        ],
        controllers: [foundation_controller_1.FoundationController],
        providers: [foundation_service_1.FoundationService],
        exports: [foundation_service_1.FoundationService]
    })
], FoundationModule);
//# sourceMappingURL=foundation.module.js.map