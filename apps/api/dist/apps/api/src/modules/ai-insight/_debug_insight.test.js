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
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const ai_insight_service_1 = require("./ai-insight.service");
let TestCtrl = class TestCtrl {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    detect(t, q) {
        return this.svc.detectAnomalies(t, q.storeId, q.metric);
    }
    list(t, q) {
        return this.svc.getAnomalies(t, q);
    }
};
__decorate([
    (0, common_1.Post)('anomalies/detect'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "detect", null);
__decorate([
    (0, common_1.Get)('anomalies'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestCtrl.prototype, "list", null);
TestCtrl = __decorate([
    (0, common_1.Controller)('ai-insight'),
    __param(0, (0, common_1.Inject)(ai_insight_service_1.AiInsightService)),
    __metadata("design:paramtypes", [ai_insight_service_1.AiInsightService])
], TestCtrl);
(0, node_test_1.default)('debug: detect then list anomalies', async () => {
    const svc = new ai_insight_service_1.AiInsightService();
    const m = await testing_1.Test.createTestingModule({
        controllers: [TestCtrl],
        providers: [{ provide: ai_insight_service_1.AiInsightService, useValue: svc }]
    }).compile();
    const app = m.createNestApplication();
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    try {
        const r1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-insight/anomalies/detect')
            .set('x-tenant-id', 'tenant-001');
        console.log('detect:', r1.statusCode, JSON.stringify(r1.body).slice(0, 200));
        const r2 = await (0, supertest_1.default)(app.getHttpServer())
            .get('/ai-insight/anomalies')
            .set('x-tenant-id', 'tenant-001');
        console.log('list:', r2.statusCode, JSON.stringify(r2.body).slice(0, 200));
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=_debug_insight.test.js.map