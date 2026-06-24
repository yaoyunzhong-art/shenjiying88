"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityAccessModule = void 0;
const common_1 = require("@nestjs/common");
const identity_access_controller_1 = require("./identity-access.controller");
const identity_access_guard_1 = require("./identity-access.guard");
const identity_access_service_1 = require("./identity-access.service");
let IdentityAccessModule = class IdentityAccessModule {
};
exports.IdentityAccessModule = IdentityAccessModule;
exports.IdentityAccessModule = IdentityAccessModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [identity_access_controller_1.IdentityAccessController],
        providers: [identity_access_service_1.IdentityAccessService, identity_access_guard_1.IdentityAccessGuard],
        exports: [identity_access_service_1.IdentityAccessService, identity_access_guard_1.IdentityAccessGuard]
    })
], IdentityAccessModule);
//# sourceMappingURL=identity-access.module.js.map