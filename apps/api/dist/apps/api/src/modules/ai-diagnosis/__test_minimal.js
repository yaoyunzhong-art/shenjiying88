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
    list() {
        return this.svc.listDiagnoses({});
    }
    getBatch() {
        return this.svc.listDiagnosisBatches({});
    }
};
__decorate([
    (0, common_1.Post)('/'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "create", null);
__decorate([
    (0, common_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "list", null);
__decorate([
    (0, common_1.Get)('/batch'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "getBatch", null);
TestCtrl = __decorate([
    (0, common_1.Controller)('ai-diagnosis'),
    __param(0, (0, common_1.Inject)(ai_diagnosis_service_1.AiDiagnosisService)),
    __metadata("design:paramtypes", [ai_diagnosis_service_1.AiDiagnosisService])
], TestCtrl);
(0, node_test_1.default)('minimal E2E: POST and GET work', async () => {
    ai_diagnosis_service_1.AiDiagnosisService.resetStores();
    const svc = new ai_diagnosis_service_1.AiDiagnosisService();
    const m = await testing_1.Test.createTestingModule({
        controllers: [TestCtrl],
        providers: [{ provide: ai_diagnosis_service_1.AiDiagnosisService, useValue: svc }],
    }).compile();
    const app = m.createNestApplication();
    try {
        await app.init();
        // POST
        const postRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-diagnosis')
            .send({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' });
        console.log('POST status:', postRes.statusCode);
        console.log('POST body keys:', Object.keys(postRes.body));
        strict_1.default.equal(postRes.statusCode, 201);
        strict_1.default.ok(postRes.body.diagnosis);
        // GET list
        const getRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/ai-diagnosis');
        console.log('GET status:', getRes.statusCode);
        strict_1.default.equal(getRes.statusCode, 200);
        strict_1.default.equal(getRes.body.total, 1);
        // GET batch (empty)
        const batchRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/ai-diagnosis/batch');
        console.log('BATCH status:', batchRes.statusCode);
        strict_1.default.equal(batchRes.statusCode, 200);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=__test_minimal.js.map