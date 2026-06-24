"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationGovernanceModule = void 0;
const common_1 = require("@nestjs/common");
const configuration_governance_controller_1 = require("./configuration-governance.controller");
const configuration_governance_service_1 = require("./configuration-governance.service");
let ConfigurationGovernanceModule = class ConfigurationGovernanceModule {
};
exports.ConfigurationGovernanceModule = ConfigurationGovernanceModule;
exports.ConfigurationGovernanceModule = ConfigurationGovernanceModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [configuration_governance_controller_1.ConfigurationGovernanceController],
        providers: [configuration_governance_service_1.ConfigurationGovernanceService],
        exports: [configuration_governance_service_1.ConfigurationGovernanceService]
    })
], ConfigurationGovernanceModule);
//# sourceMappingURL=configuration-governance.module.js.map