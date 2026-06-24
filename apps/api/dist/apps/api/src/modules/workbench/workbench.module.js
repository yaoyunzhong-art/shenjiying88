"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbenchModule = void 0;
const common_1 = require("@nestjs/common");
const foundation_module_1 = require("../foundation/foundation.module");
const market_module_1 = require("../market/market.module");
const portal_module_1 = require("../portal/portal.module");
const workbench_controller_1 = require("./workbench.controller");
const workbench_service_1 = require("./workbench.service");
let WorkbenchModule = class WorkbenchModule {
};
exports.WorkbenchModule = WorkbenchModule;
exports.WorkbenchModule = WorkbenchModule = __decorate([
    (0, common_1.Module)({
        imports: [foundation_module_1.FoundationModule, market_module_1.MarketModule, portal_module_1.PortalModule],
        controllers: [workbench_controller_1.WorkbenchController],
        providers: [workbench_service_1.WorkbenchService]
    })
], WorkbenchModule);
//# sourceMappingURL=workbench.module.js.map