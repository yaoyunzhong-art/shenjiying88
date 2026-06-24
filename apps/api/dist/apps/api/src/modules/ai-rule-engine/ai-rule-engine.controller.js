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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRuleEngineController = void 0;
const common_1 = require("@nestjs/common");
const ai_rule_engine_service_1 = require("./ai-rule-engine.service");
const ai_rule_engine_dto_1 = require("./ai-rule-engine.dto");
let AiRuleEngineController = class AiRuleEngineController {
    aiRuleEngineService;
    constructor(aiRuleEngineService) {
        this.aiRuleEngineService = aiRuleEngineService;
    }
    evaluate(body) {
        const { type, data } = body;
        if (type === 'member-level') {
            const result = this.aiRuleEngineService.evaluateMemberLevel(data);
            return {
                type: 'member-level',
                result,
                timestamp: new Date().toISOString()
            };
        }
        if (type === 'device-anomaly') {
            const result = this.aiRuleEngineService.detectDeviceAnomaly(data);
            return {
                type: 'device-anomaly',
                result,
                timestamp: new Date().toISOString()
            };
        }
        throw new Error(`Unsupported evaluation type: ${type}. Supported: member-level, device-anomaly`);
    }
    evaluateMemberLevel(input) {
        const result = this.aiRuleEngineService.evaluateMemberLevel(input);
        return {
            type: 'member-level',
            result,
            timestamp: new Date().toISOString()
        };
    }
    detectDeviceAnomaly(input) {
        const result = this.aiRuleEngineService.detectDeviceAnomaly(input);
        return {
            type: 'device-anomaly',
            result,
            timestamp: new Date().toISOString()
        };
    }
    /** 批量评估：一次请求评估多个成员和设备 */
    evaluateBatch(request) {
        // DTO 在运行时经 ValidationPipe 保证结构与 BatchEvaluateRequest 一致
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.aiRuleEngineService.batchEvaluate(request);
    }
    /** 风险评分：综合评估业务风险 */
    evaluateRiskScore(input) {
        const result = this.aiRuleEngineService.evaluateRiskScore(input);
        return {
            type: 'risk-score',
            result,
            timestamp: new Date().toISOString()
        };
    }
    /** 获取所有规则引擎状态 */
    getEngines() {
        return this.aiRuleEngineService.getEngineStatus();
    }
    /** 获取所有模拟器 */
    listSimulators() {
        return this.aiRuleEngineService.listSimulators();
    }
    /** 获取指定模拟器 */
    getSimulator(id) {
        return this.aiRuleEngineService.getSimulator(id);
    }
    /** 单次模拟运行 */
    runSimulator(input) {
        return this.aiRuleEngineService.runSimulator(input);
    }
    /** 批量模拟运行 */
    runSimulatorBatch(input) {
        return this.aiRuleEngineService.runSimulatorBatch(input);
    }
};
exports.AiRuleEngineController = AiRuleEngineController;
__decorate([
    (0, common_1.Post)('evaluate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_rule_engine_dto_1.EvaluateRequestDto]),
    __metadata("design:returntype", Object)
], AiRuleEngineController.prototype, "evaluate", null);
__decorate([
    (0, common_1.Post)('evaluate/member-level'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_rule_engine_dto_1.MemberLevelInputDto]),
    __metadata("design:returntype", Object)
], AiRuleEngineController.prototype, "evaluateMemberLevel", null);
__decorate([
    (0, common_1.Post)('evaluate/device-anomaly'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_rule_engine_dto_1.DeviceAnomalyInputDto]),
    __metadata("design:returntype", Object)
], AiRuleEngineController.prototype, "detectDeviceAnomaly", null);
__decorate([
    (0, common_1.Post)('evaluate/batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_rule_engine_dto_1.BatchEvaluateRequestDto]),
    __metadata("design:returntype", Object)
], AiRuleEngineController.prototype, "evaluateBatch", null);
__decorate([
    (0, common_1.Post)('evaluate/risk-score'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_rule_engine_dto_1.RiskScoreInputDto]),
    __metadata("design:returntype", Object)
], AiRuleEngineController.prototype, "evaluateRiskScore", null);
__decorate([
    (0, common_1.Get)('engines'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiRuleEngineController.prototype, "getEngines", null);
__decorate([
    (0, common_1.Get)('simulators'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], AiRuleEngineController.prototype, "listSimulators", null);
__decorate([
    (0, common_1.Get)('simulators/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AiRuleEngineController.prototype, "getSimulator", null);
__decorate([
    (0, common_1.Post)('simulators/run'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_rule_engine_dto_1.SimulatorRunInputDto]),
    __metadata("design:returntype", Object)
], AiRuleEngineController.prototype, "runSimulator", null);
__decorate([
    (0, common_1.Post)('simulators/run-batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AiRuleEngineController.prototype, "runSimulatorBatch", null);
exports.AiRuleEngineController = AiRuleEngineController = __decorate([
    (0, common_1.Controller)('ai-rule-engine'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __metadata("design:paramtypes", [ai_rule_engine_service_1.AiRuleEngineService])
], AiRuleEngineController);
//# sourceMappingURL=ai-rule-engine.controller.js.map