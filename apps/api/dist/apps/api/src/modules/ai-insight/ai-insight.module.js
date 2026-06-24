"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiInsightModule = void 0;
const common_1 = require("@nestjs/common");
const ai_insight_controller_1 = require("./ai-insight.controller");
const ai_insight_service_1 = require("./ai-insight.service");
let AiInsightModule = class AiInsightModule {
};
exports.AiInsightModule = AiInsightModule;
exports.AiInsightModule = AiInsightModule = __decorate([
    (0, common_1.Module)({
        controllers: [ai_insight_controller_1.AiInsightController],
        providers: [ai_insight_service_1.AiInsightService],
        exports: [ai_insight_service_1.AiInsightService]
    })
], AiInsightModule);
//# sourceMappingURL=ai-insight.module.js.map