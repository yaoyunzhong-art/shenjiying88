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
exports.AiDiagnosisController = void 0;
const common_1 = require("@nestjs/common");
const ai_diagnosis_service_1 = require("./ai-diagnosis.service");
const ai_diagnosis_dto_1 = require("./ai-diagnosis.dto");
let AiDiagnosisController = class AiDiagnosisController {
    diagnosisService;
    constructor(diagnosisService) {
        this.diagnosisService = diagnosisService;
    }
    // ── 诊断 CRUD ──
    create(dto) {
        const diagnosis = this.diagnosisService.createDiagnosis(dto);
        return { diagnosis };
    }
    list(query) {
        return this.diagnosisService.listDiagnoses(query);
    }
    get(diagnosisId) {
        const diagnosis = this.diagnosisService.getDiagnosis(diagnosisId);
        if (!diagnosis) {
            throw new common_1.NotFoundException(`Diagnosis ${diagnosisId} not found`);
        }
        return { diagnosis };
    }
    update(diagnosisId, dto) {
        const diagnosis = this.diagnosisService.updateDiagnosis(diagnosisId, dto);
        if (!diagnosis) {
            throw new common_1.NotFoundException(`Diagnosis ${diagnosisId} not found`);
        }
        return { diagnosis };
    }
    remove(diagnosisId) {
        const deleted = this.diagnosisService.deleteDiagnosis(diagnosisId);
        if (!deleted) {
            throw new common_1.NotFoundException(`Diagnosis ${diagnosisId} not found`);
        }
    }
    // ── 批量诊断 ──
    createBatch(dto) {
        const batch = this.diagnosisService.createDiagnosisBatch(dto);
        return { batch };
    }
    getBatch(batchId) {
        const batch = this.diagnosisService.getDiagnosisBatch(batchId);
        if (!batch) {
            throw new common_1.NotFoundException(`Diagnosis batch ${batchId} not found`);
        }
        return { batch };
    }
    listBatches(engineId, tenantId) {
        return this.diagnosisService.listDiagnosisBatches({ engineId, tenantId });
    }
    // ── 风险报告 ──
    riskReport(engineId, tenantId) {
        return this.diagnosisService.generateRiskReport({ engineId, tenantId });
    }
};
exports.AiDiagnosisController = AiDiagnosisController;
__decorate([
    (0, common_1.Post)('/'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_diagnosis_dto_1.CreateDiagnosisDto]),
    __metadata("design:returntype", Object)
], AiDiagnosisController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('/'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_diagnosis_dto_1.DiagnosisQueryDto]),
    __metadata("design:returntype", Object)
], AiDiagnosisController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('/:diagnosisId'),
    __param(0, (0, common_1.Param)('diagnosisId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AiDiagnosisController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)('/:diagnosisId'),
    __param(0, (0, common_1.Param)('diagnosisId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_diagnosis_dto_1.UpdateDiagnosisDto]),
    __metadata("design:returntype", Object)
], AiDiagnosisController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('/:diagnosisId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('diagnosisId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiDiagnosisController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('/batch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_diagnosis_dto_1.CreateDiagnosisBatchDto]),
    __metadata("design:returntype", Object)
], AiDiagnosisController.prototype, "createBatch", null);
__decorate([
    (0, common_1.Get)('/batch/:batchId'),
    __param(0, (0, common_1.Param)('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AiDiagnosisController.prototype, "getBatch", null);
__decorate([
    (0, common_1.Get)('/batch'),
    __param(0, (0, common_1.Query)('engineId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Array)
], AiDiagnosisController.prototype, "listBatches", null);
__decorate([
    (0, common_1.Get)('/report/risk'),
    __param(0, (0, common_1.Query)('engineId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Object)
], AiDiagnosisController.prototype, "riskReport", null);
exports.AiDiagnosisController = AiDiagnosisController = __decorate([
    (0, common_1.Controller)('ai-diagnosis'),
    __metadata("design:paramtypes", [ai_diagnosis_service_1.AiDiagnosisService])
], AiDiagnosisController);
//# sourceMappingURL=ai-diagnosis.controller.js.map