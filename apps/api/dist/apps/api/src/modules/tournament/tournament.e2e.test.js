"use strict";
/**
 * 🐜 自动: [tournament] E2E 基础测试
 *
 * E2E 链路: HTTP → TournamentController → TournamentService → Tournament/Match/Ranking
 *
 * 覆盖:
 *   - Tournament CRUD: 创建 / 详情 / 列表 / 更新
 *   - 状态机: Draft → Open → Ongoing → Completed
 *   - 个人报名: 注册 / 重复报名 / 满员
 *   - 团队报名: 创建团队 / 审核通过 / 拒绝
 *   - Bracket 生成: 单淘汰 / 循环赛 / 至少 2 人
 *   - 比赛结果: 录入分数 / 自动完成 tournament
 *   - 排名计算
 *   - 跨租户隔离
 *   - 错误处理 (404)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const tournament_service_1 = require("./tournament.service");
const tournament_entity_1 = require("./tournament.entity");
// ========== 测试 Controller ==========
let TestTournamentController = class TestTournamentController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(tenantId, dto) {
        return this.service.createTournament({ ...dto, tenantId });
    }
    list(tenantId, query) {
        return this.service.listTournaments(tenantId, {
            status: query.status,
            type: query.type,
            storeId: query.storeId,
            brandId: query.brandId
        });
    }
    detail(tenantId, id) {
        const t = this.service.getTournament(id, tenantId);
        if (!t)
            throw new common_1.NotFoundException(`Tournament ${id} not found`);
        return t;
    }
    updateStatus(tenantId, id, body) {
        return this.service.updateTournamentStatus(id, body.status, tenantId);
    }
    register(tenantId, id, body) {
        return this.service.registerParticipant(id, body.memberId, tenantId);
    }
    registerTeam(tenantId, id, body) {
        return this.service.registerTeam({
            tournamentId: id,
            teamName: body.teamName,
            captainId: body.captainId,
            memberIds: body.memberIds
        }, tenantId);
    }
    approveTeam(tenantId, teamRegId) {
        return this.service.approveTeam(teamRegId, tenantId);
    }
    rejectTeam(tenantId, teamRegId) {
        return this.service.rejectTeam(teamRegId, tenantId);
    }
    bracket(tenantId, id) {
        return this.service.generateBracket(id, tenantId);
    }
    matches(tenantId, id, query) {
        return this.service.listMatches(id, tenantId, {
            round: query.round ? Number(query.round) : undefined,
            status: query.status
        });
    }
    rankings(tenantId, id) {
        return this.service.getRankings(id, tenantId);
    }
    recordResult(tenantId, matchId, body) {
        return this.service.recordMatchResult(matchId, body.score1, body.score2, tenantId);
    }
    dispute(tenantId, matchId) {
        return this.service.setDisputed(matchId, tenantId);
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "detail", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/register'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "register", null);
__decorate([
    (0, common_1.Post)(':id/teams'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "registerTeam", null);
__decorate([
    (0, common_1.Put)('teams/:teamRegId/approve'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('teamRegId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "approveTeam", null);
__decorate([
    (0, common_1.Put)('teams/:teamRegId/reject'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('teamRegId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "rejectTeam", null);
__decorate([
    (0, common_1.Post)(':id/bracket'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "bracket", null);
__decorate([
    (0, common_1.Get)(':id/matches'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "matches", null);
__decorate([
    (0, common_1.Get)(':id/rankings'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "rankings", null);
__decorate([
    (0, common_1.Put)('matches/:matchId/result'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('matchId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "recordResult", null);
__decorate([
    (0, common_1.Put)('matches/:matchId/dispute'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestTournamentController.prototype, "dispute", null);
TestTournamentController = __decorate([
    (0, common_1.Controller)('tournament'),
    __param(0, (0, common_1.Inject)(tournament_service_1.TournamentService)),
    __metadata("design:paramtypes", [tournament_service_1.TournamentService])
], TestTournamentController);
// ========== 构建 app ==========
async function buildApp() {
    const service = new tournament_service_1.TournamentService();
    service.resetTournamentStoresForTests();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestTournamentController],
        providers: [{ provide: tournament_service_1.TournamentService, useValue: service }]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, service };
}
const TENANT_HEADERS = {
    'x-tenant-id': 'tenant-001',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001'
};
const TENANT_B_HEADERS = {
    'x-tenant-id': 'tenant-002',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001'
};
// ========== helpers ==========
async function createTournament(app, headers = TENANT_HEADERS, overrides = {}) {
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .post('/tournament')
        .set(headers)
        .send({
        name: 'Test Tournament',
        type: tournament_entity_1.TournamentType.SingleElimination,
        gameName: '台球',
        startDate: '2026-07-01',
        endDate: '2026-07-07',
        maxParticipants: 8,
        ...overrides
    });
    return res;
}
async function openTournament(app, id, headers = TENANT_HEADERS) {
    return (0, supertest_1.default)(app.getHttpServer())
        .put(`/tournament/${id}/status`)
        .set(headers)
        .send({ status: tournament_entity_1.TournamentStatus.Open });
}
// ========== E2E: Tournament CRUD ==========
(0, node_test_1.describe)('E2E: Tournament CRUD', () => {
    (0, node_test_1.default)('POST → GET :id → GET 列表 完整生命周期', async () => {
        const { app } = await buildApp();
        try {
            const createRes = await createTournament(app);
            strict_1.default.equal(createRes.statusCode, 201);
            const tournamentId = createRes.body.data.id;
            strict_1.default.ok(tournamentId.startsWith('tournament-'));
            strict_1.default.equal(createRes.body.data.status, tournament_entity_1.TournamentStatus.Draft);
            const detailRes = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/tournament/${tournamentId}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(detailRes.statusCode, 200);
            strict_1.default.equal(detailRes.body.data.id, tournamentId);
            const listRes = await (0, supertest_1.default)(app.getHttpServer())
                .get('/tournament')
                .set(TENANT_HEADERS);
            strict_1.default.equal(listRes.statusCode, 200);
            strict_1.default.ok(listRes.body.data.length >= 1);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /tournament/:id 不存在返回 404', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/tournament/non-existent-id')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /tournament?status=Draft 状态过滤', async () => {
        const { app } = await buildApp();
        try {
            await createTournament(app);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/tournament?status=${tournament_entity_1.TournamentStatus.Draft}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            for (const t of res.body.data)
                strict_1.default.equal(t.status, tournament_entity_1.TournamentStatus.Draft);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /tournament?type=ROUND_ROBIN 类型过滤', async () => {
        const { app } = await buildApp();
        try {
            await createTournament(app, TENANT_HEADERS, { type: tournament_entity_1.TournamentType.RoundRobin });
            await createTournament(app, TENANT_HEADERS, { name: 'T2', type: tournament_entity_1.TournamentType.SingleElimination });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/tournament?type=${tournament_entity_1.TournamentType.RoundRobin}`)
                .set(TENANT_HEADERS);
            for (const t of res.body.data)
                strict_1.default.equal(t.type, tournament_entity_1.TournamentType.RoundRobin);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 状态机 ==========
(0, node_test_1.describe)('E2E: 状态机转换', () => {
    (0, node_test_1.default)('Draft → Open 合法转换', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            const res = await openTournament(app, id);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.status, tournament_entity_1.TournamentStatus.Open);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('Open → Ongoing (生成 bracket) 合法转换', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            await openTournament(app, id);
            // 注册 2 名选手
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm1' });
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm2' });
            const bracketRes = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/bracket`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(bracketRes.statusCode, 201);
            strict_1.default.ok(bracketRes.body.data.length >= 1);
            // tournament 状态应转 Ongoing
            const detail = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/tournament/${id}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(detail.body.data.status, tournament_entity_1.TournamentStatus.Ongoing);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('Draft 不可直接进 Ongoing', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/tournament/${id}/status`)
                .set(TENANT_HEADERS)
                .send({ status: tournament_entity_1.TournamentStatus.Ongoing });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('Completed 不可再转换', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            // Draft → Cancelled (合法,但 Completed 不能进)
            await (0, supertest_1.default)(app.getHttpServer())
                .put(`/tournament/${id}/status`)
                .set(TENANT_HEADERS)
                .send({ status: tournament_entity_1.TournamentStatus.Cancelled });
            // 试图转 Completed 应失败
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/tournament/${id}/status`)
                .set(TENANT_HEADERS)
                .send({ status: tournament_entity_1.TournamentStatus.Completed });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 报名 ==========
(0, node_test_1.describe)('E2E: 报名流程', () => {
    (0, node_test_1.default)('个人报名 + 重复报名报错', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            await openTournament(app, id);
            const reg1 = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm1' });
            strict_1.default.equal(reg1.statusCode, 201);
            strict_1.default.equal(reg1.body.data.currentParticipants, 1);
            const reg2 = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm1' });
            strict_1.default.equal(reg2.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('满员后禁止报名', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app, TENANT_HEADERS, { maxParticipants: 1 });
            const id = create.body.data.id;
            await openTournament(app, id);
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm1' });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm2' });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('Draft 状态禁止报名', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            // tournament 还是 Draft
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm1' });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('团队报名 → 审核通过 / 拒绝', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            await openTournament(app, id);
            const teamRes = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/teams`)
                .set(TENANT_HEADERS)
                .send({ teamName: 'Team Alpha', captainId: 'c1', memberIds: ['c1', 'c2', 'c3'] });
            strict_1.default.equal(teamRes.statusCode, 201);
            strict_1.default.equal(teamRes.body.data.status, 'PENDING');
            const teamRegId = teamRes.body.data.id;
            const approveRes = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/tournament/teams/${teamRegId}/approve`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(approveRes.statusCode, 200);
            strict_1.default.equal(approveRes.body.data.status, 'APPROVED');
            // 再注册一个团队,这次拒绝
            const team2 = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/teams`)
                .set(TENANT_HEADERS)
                .send({ teamName: 'Team Beta', captainId: 'c4', memberIds: ['c4', 'c5'] });
            const rejectRes = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/tournament/teams/${team2.body.data.id}/reject`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(rejectRes.statusCode, 200);
            strict_1.default.equal(rejectRes.body.data.status, 'REJECTED');
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: Bracket ==========
(0, node_test_1.describe)('E2E: Bracket 生成', () => {
    (0, node_test_1.default)('单淘汰: 4 人 → 2 首轮比赛 + 1 决赛占位', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            await openTournament(app, id);
            for (const m of ['m1', 'm2', 'm3', 'm4']) {
                await (0, supertest_1.default)(app.getHttpServer())
                    .post(`/tournament/${id}/register`)
                    .set(TENANT_HEADERS)
                    .send({ memberId: m });
            }
            const bracket = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/bracket`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(bracket.statusCode, 201);
            strict_1.default.equal(bracket.body.data.length, 3); // 2 首轮 + 1 决赛占位
            const round1 = bracket.body.data.filter((m) => m.round === 1);
            strict_1.default.equal(round1.length, 2);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('循环赛: 3 人 → 3 场比赛 (每两两一对)', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app, TENANT_HEADERS, {
                type: tournament_entity_1.TournamentType.RoundRobin
            });
            const id = create.body.data.id;
            await openTournament(app, id);
            for (const m of ['m1', 'm2', 'm3']) {
                await (0, supertest_1.default)(app.getHttpServer())
                    .post(`/tournament/${id}/register`)
                    .set(TENANT_HEADERS)
                    .send({ memberId: m });
            }
            const bracket = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/bracket`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(bracket.statusCode, 201);
            // C(3,2) = 3
            strict_1.default.equal(bracket.body.data.length, 3);
            // 所有比赛都是 round 1
            for (const m of bracket.body.data)
                strict_1.default.equal(m.round, 1);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('少于 2 人 → Bracket 报错', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            await openTournament(app, id);
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm1' });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/bracket`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 比赛结果 & 排名 ==========
(0, node_test_1.describe)('E2E: 比赛结果与排名', () => {
    (0, node_test_1.default)('录入比赛结果 → 自动更新 ranking + 比赛 completed', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            await openTournament(app, id);
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm1' });
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm2' });
            const bracket = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/bracket`)
                .set(TENANT_HEADERS);
            const match = bracket.body.data[0];
            const matchId = match.id;
            // shuffleArray 随机配对,player1/player2 不固定。
            // 让 score1=player1 赢 → winner = player1
            const result = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/tournament/matches/${matchId}/result`)
                .set(TENANT_HEADERS)
                .send({ score1: 21, score2: 15 });
            strict_1.default.equal(result.statusCode, 200);
            strict_1.default.equal(result.body.data.status, tournament_entity_1.MatchStatus.Completed);
            strict_1.default.equal(result.body.data.winnerId, match.player1Id, 'score1>score2 应让 player1 获胜');
            const rankings = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/tournament/${id}/rankings`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(rankings.statusCode, 200);
            // 胜利者排第 1
            const winnerRanking = rankings.body.data.find((r) => r.memberId === match.player1Id);
            strict_1.default.equal(winnerRanking.rank, 1);
            strict_1.default.equal(winnerRanking.wins, 1);
            strict_1.default.equal(winnerRanking.points, 3);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('比赛争议: PUT /dispute 转 disputed', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            await openTournament(app, id);
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm1' });
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm2' });
            const bracket = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/bracket`)
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/tournament/matches/${bracket.body.data[0].id}/dispute`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.status, tournament_entity_1.MatchStatus.Disputed);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /tournament/:id/matches?status=Pending 过滤', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app);
            const id = create.body.data.id;
            await openTournament(app, id);
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm1' });
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/register`)
                .set(TENANT_HEADERS)
                .send({ memberId: 'm2' });
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/tournament/${id}/bracket`)
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/tournament/${id}/matches?status=${tournament_entity_1.MatchStatus.Pending}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            for (const m of res.body.data)
                strict_1.default.equal(m.status, tournament_entity_1.MatchStatus.Pending);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 跨租户隔离 ==========
(0, node_test_1.describe)('E2E: 跨租户隔离', () => {
    (0, node_test_1.default)('tenant-B 看不到 tenant-A 的 tournament', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app, TENANT_HEADERS);
            const id = create.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/tournament/${id}`)
                .set(TENANT_B_HEADERS);
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('tenant-B 列表只返回自己的', async () => {
        const { app } = await buildApp();
        try {
            await createTournament(app, TENANT_HEADERS, { name: 'A-1' });
            await createTournament(app, TENANT_B_HEADERS, { name: 'B-1' });
            const a = await (0, supertest_1.default)(app.getHttpServer())
                .get('/tournament')
                .set(TENANT_HEADERS);
            const b = await (0, supertest_1.default)(app.getHttpServer())
                .get('/tournament')
                .set(TENANT_B_HEADERS);
            strict_1.default.ok(a.body.data.every((t) => t.tenantId === 'tenant-001'));
            strict_1.default.ok(b.body.data.every((t) => t.tenantId === 'tenant-002'));
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('tenant-B 无法修改 tenant-A 的 tournament 状态', async () => {
        const { app } = await buildApp();
        try {
            const create = await createTournament(app, TENANT_HEADERS);
            const id = create.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/tournament/${id}/status`)
                .set(TENANT_B_HEADERS)
                .send({ status: tournament_entity_1.TournamentStatus.Open });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
//# sourceMappingURL=tournament.e2e.test.js.map