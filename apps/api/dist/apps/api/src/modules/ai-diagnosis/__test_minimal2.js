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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const ai_diagnosis_service_1 = require("./ai-diagnosis.service");
let TestCtrl = class TestCtrl {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    create(dto) {
        return { diagnosis: this.svc.createDiagnosis(dto) };
    }
    list(query) {
        return this.svc.listDiagnoses(query);
    }
    get(diagnosisId) {
        const d = this.svc.getDiagnosis(diagnosisId);
        if (!d)
            throw new common_1.NotFoundException(`Diagnosis ${diagnosisId} not found`);
        return { diagnosis: d };
    }
    update(diagnosisId, dto) {
        const d = this.svc.updateDiagnosis(diagnosisId, dto);
        if (!d)
            throw new common_1.NotFoundException(`Diagnosis ${diagnosisId} not found`);
        return { diagnosis: d };
    }
    remove(diagnosisId) {
        const ok = this.svc.deleteDiagnosis(diagnosisId);
        if (!ok)
            throw new common_1.NotFoundException(`Diagnosis ${diagnosisId} not found`);
    }
    createBatch(dto) {
        return { batch: this.svc.createDiagnosisBatch(dto) };
    }
    listBatches(engineId, tenantId) {
        return this.svc.listDiagnosisBatches({ engineId, tenantId });
    }
    getBatch(batchId) {
        const b = this.svc.getDiagnosisBatch(batchId);
        if (!b)
            throw new common_1.NotFoundException(`Diagnosis batch ${batchId} not found`);
        return { batch: b };
    }
    riskReport(engineId, tenantId) {
        return this.svc.generateRiskReport({ engineId, tenantId });
    }
};
__decorate([
    (0, common_1.Post)('/'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "create", null);
__decorate([
    (0, common_1.Get)('/'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "list", null);
__decorate([
    (0, common_1.Get)('/:diagnosisId'),
    __param(0, (0, common_1.Param)('diagnosisId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "get", null);
__decorate([
    (0, common_1.Patch)('/:diagnosisId'),
    __param(0, (0, common_1.Param)('diagnosisId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('/:diagnosisId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('diagnosisId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('/batch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "createBatch", null);
__decorate([
    (0, common_1.Get)('/batch'),
    __param(0, (0, common_1.Query)('engineId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "listBatches", null);
__decorate([
    (0, common_1.Get)('/batch/:batchId'),
    __param(0, (0, common_1.Param)('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "getBatch", null);
__decorate([
    (0, common_1.Get)('/report/risk'),
    __param(0, (0, common_1.Query)('engineId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "riskReport", null);
TestCtrl = __decorate([
    (0, common_1.Controller)('ai-diagnosis'),
    __param(0, (0, common_1.Inject)(ai_diagnosis_service_1.AiDiagnosisService)),
    __metadata("design:paramtypes", [ai_diagnosis_service_1.AiDiagnosisService])
], TestCtrl);
(0, node_test_1.default)('GET /batch works alongside /batch/:batchId', async () => {
    ai_diagnosis_service_1.AiDiagnosisService.resetStores();
    const svc = new ai_diagnosis_service_1.AiDiagnosisService();
    const m = await testing_1.Test.createTestingModule({
        controllers: [TestCtrl],
        providers: [{ provide: ai_diagnosis_service_1.AiDiagnosisService, useValue: svc }],
    }).compile();
    const app = m.createNestApplication();
    try {
        await app.init();
        // Create a batch
        svc.createDiagnosisBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't1', triggeredBy: 'u1' });
        // GET /batch (list)
        const listRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/ai-diagnosis/batch');
        console.log('LIST status:', listRes.statusCode, 'body:', JSON.stringify(listRes.body).slice(0, 200));
        // GET /batch?engineId=x (filtered list)
        const filterRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/ai-diagnosis/batch?engineId=e1');
        console.log('FILTER status:', filterRes.statusCode);
        // GET /batch/some-id (single)
        const singleRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/ai-diagnosis/batch/non-existent');
        console.log('SINGLE status:', singleRes.statusCode);
        strict_1.default.equal(listRes.statusCode, 200);
        strict_1.default.equal(filterRes.statusCode, 200);
        strict_1.default.equal(singleRes.statusCode, 404);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=__test_minimal2.js.map