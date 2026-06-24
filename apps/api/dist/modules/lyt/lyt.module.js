"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LytModule = void 0;
const common_1 = require("@nestjs/common");
const foundation_module_1 = require("../foundation/foundation.module");
const mock_lyt_adapter_1 = require("./adapters/mock-lyt.adapter");
const lyt_connection_manager_1 = require("./lyt-connection.manager");
const lyt_controller_1 = require("./lyt.controller");
const lyt_service_1 = require("./lyt.service");
let LytModule = class LytModule {
};
exports.LytModule = LytModule;
exports.LytModule = LytModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [foundation_module_1.FoundationModule],
        controllers: [lyt_controller_1.LytController],
        providers: [mock_lyt_adapter_1.MockLytAdapter, lyt_connection_manager_1.LytConnectionManager, lyt_service_1.LytService],
        exports: [mock_lyt_adapter_1.MockLytAdapter, lyt_connection_manager_1.LytConnectionManager, lyt_service_1.LytService]
    })
], LytModule);
//# sourceMappingURL=lyt.module.js.map