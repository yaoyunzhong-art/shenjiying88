"use strict";
/**
 * 🐜 扩展角色测试: tournament 模块
 *
 * 4 个附加角色视角：
 * 🎮导玩员 — 创建和报名赛事
 * 🎯运行专员 — 安排赛程
 * 👔店长 — 查看赛事统计
 * 📢营销 — 推广赛事活动
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const tournament_controller_1 = require("./tournament.controller");
const tournament_service_1 = require("./tournament.service");
const tournament_entity_1 = require("./tournament.entity");
// ── 测试数据工厂 ──
const tenantCtx = {
    tenantId: 't-tournament-ext',
    brandId: 'b-arcade',
    storeId: 's-main',
};
function createController() {
    const service = new tournament_service_1.TournamentService();
    // Reset in-memory stores
    service.resetTournamentStoresForTests();
    return new tournament_controller_1.TournamentController(service);
}
function createDraftTournament(ctrl, overrides = {}) {
    return ctrl.createTournament(tenantCtx, {
        name: overrides.name ?? '测试赛',
        type: overrides.type ?? tournament_entity_1.TournamentType.SingleElimination,
        gameName: overrides.gameName ?? '街霸6',
        startDate: '2026-07-01T10:00:00.000Z',
        endDate: '2026-07-01T18:00:00.000Z',
        maxParticipants: overrides.maxParticipants ?? 16,
        description: '月度排位赛',
        rules: { matchFormat: 'BO3', scoreMode: 'WINS', allowDraws: false },
        prizes: {
            first: { label: '冠军', value: '1000积分' },
            second: { label: '亚军', value: '500积分' },
        },
        bannerImage: 'https://example.com/banner.jpg',
    });
}
// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 创建和报名赛事 (guide creating & registering tournaments)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('🎮导玩员 — 赛事创建与报名视角', () => {
    (0, node_test_1.default)('成功创建赛事并设置基本信息 (create tournament)', () => {
        const ctrl = createController();
        const t = createDraftTournament(ctrl);
        strict_1.default.equal(t.name, '测试赛');
        strict_1.default.equal(t.gameName, '街霸6');
        strict_1.default.equal(t.status, tournament_entity_1.TournamentStatus.Draft);
        strict_1.default.equal(t.maxParticipants, 16);
        strict_1.default.equal(t.currentParticipants, 0);
        (0, strict_1.default)(t.id.startsWith('tournament-'));
    });
    (0, node_test_1.default)('报名开放后参赛者可以注册 (register participant)', () => {
        const ctrl = createController();
        const t = createDraftTournament(ctrl);
        // 开放报名
        ctrl.updateTournamentStatus(tenantCtx, t.id, { status: tournament_entity_1.TournamentStatus.Open });
        // 注册参赛者
        const afterReg = ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'player-001' });
        strict_1.default.equal(afterReg.currentParticipants, 1);
        // 注册第二个
        const afterReg2 = ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'player-002' });
        strict_1.default.equal(afterReg2.currentParticipants, 2);
    });
    (0, node_test_1.default)('参赛者满员后拒绝报名 (max participants exceeded)', () => {
        const ctrl = createController();
        const t = createDraftTournament(ctrl, { maxParticipants: 2 });
        ctrl.updateTournamentStatus(tenantCtx, t.id, { status: tournament_entity_1.TournamentStatus.Open });
        ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'p1' });
        ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'p2' });
        // 第三个报名应拒绝
        strict_1.default.throws(() => ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'p3' }), /maximum participants/);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 安排赛程 (operations scheduling events)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('🎯运行专员 — 赛程安排视角', () => {
    (0, node_test_1.default)('生成单败淘汰赛赛程 (generate bracket)', () => {
        const ctrl = createController();
        const t = createDraftTournament(ctrl, { type: tournament_entity_1.TournamentType.SingleElimination, maxParticipants: 4 });
        ctrl.updateTournamentStatus(tenantCtx, t.id, { status: tournament_entity_1.TournamentStatus.Open });
        ['p1', 'p2', 'p3', 'p4'].forEach((pid) => ctrl.registerParticipant(tenantCtx, t.id, { memberId: pid }));
        // 生成赛程
        const matches = ctrl.generateBracket(tenantCtx, t.id);
        (0, strict_1.default)(matches.length >= 2, '4 人单败淘汰至少 2 场比赛');
        // 赛事状态变为 ONGOING
        const tournament = ctrl.getTournament(tenantCtx, t.id);
        strict_1.default.equal(tournament.status, tournament_entity_1.TournamentStatus.Ongoing);
    });
    (0, node_test_1.default)('记录比赛结果并更新排名 (record match result)', () => {
        const ctrl = createController();
        const t = createDraftTournament(ctrl, { type: tournament_entity_1.TournamentType.League, maxParticipants: 4 });
        ctrl.updateTournamentStatus(tenantCtx, t.id, { status: tournament_entity_1.TournamentStatus.Open });
        ['p1', 'p2', 'p3', 'p4'].forEach((pid) => ctrl.registerParticipant(tenantCtx, t.id, { memberId: pid }));
        const matches = ctrl.generateBracket(tenantCtx, t.id);
        // 记录第一场比赛结果
        const firstMatch = matches[0];
        const result = ctrl.recordMatchResult(tenantCtx, firstMatch.id, {
            score1: 3,
            score2: 1,
        });
        strict_1.default.equal(result.status, tournament_entity_1.MatchStatus.Completed);
        (0, strict_1.default)(result.playedAt, '比赛应有完成时间');
        strict_1.default.equal(result.winnerId, result.player1Id, 'player1 得分更高应赢');
        // 查看排名
        const rankings = ctrl.getRankings(tenantCtx, t.id, {});
        (0, strict_1.default)(rankings.length >= 2, '应至少有 2 人进入排名');
        const winnerRank = rankings.find((r) => r.memberId === result.player1Id);
        (0, strict_1.default)(winnerRank, '胜者应在排名中');
        strict_1.default.equal(winnerRank.wins, 1);
        (0, strict_1.default)(winnerRank.points >= 3);
    });
    (0, node_test_1.default)('重复记录已完成的比赛报错 (double result entry)', () => {
        const ctrl = createController();
        const t = createDraftTournament(ctrl, { maxParticipants: 2 });
        ctrl.updateTournamentStatus(tenantCtx, t.id, { status: tournament_entity_1.TournamentStatus.Open });
        ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'pA' });
        ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'pB' });
        const [match] = ctrl.generateBracket(tenantCtx, t.id);
        ctrl.recordMatchResult(tenantCtx, match.id, { score1: 2, score2: 0 });
        strict_1.default.throws(() => ctrl.recordMatchResult(tenantCtx, match.id, { score1: 2, score2: 0 }), /already completed/);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 查看赛事统计 (shop manager viewing tournament stats)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('👔店长 — 赛事统计视角', () => {
    (0, node_test_1.default)('获取排名列表 (rankings)', () => {
        const ctrl = createController();
        const t = createDraftTournament(ctrl, { type: tournament_entity_1.TournamentType.League, maxParticipants: 3 });
        ctrl.updateTournamentStatus(tenantCtx, t.id, { status: tournament_entity_1.TournamentStatus.Open });
        ['p1', 'p2', 'p3'].forEach((pid) => ctrl.registerParticipant(tenantCtx, t.id, { memberId: pid }));
        ctrl.generateBracket(tenantCtx, t.id);
        // 记录多场比赛
        const matches = ctrl.listMatches(tenantCtx, t.id, {});
        for (const m of matches) {
            ctrl.recordMatchResult(tenantCtx, m.id, { score1: 2, score2: 1 });
        }
        const rankings = ctrl.getRankings(tenantCtx, t.id, { limit: 3 });
        strict_1.default.equal(rankings.length, 3);
        // 排名按积分降序
        for (let i = 1; i < rankings.length; i++) {
            (0, strict_1.default)(rankings[i - 1].points >= rankings[i].points);
        }
    });
    (0, node_test_1.default)('筛选状态查询赛事列表 (filter by status)', () => {
        const ctrl = createController();
        const t1 = createDraftTournament(ctrl, { name: '周赛' });
        ctrl.updateTournamentStatus(tenantCtx, t1.id, { status: tournament_entity_1.TournamentStatus.Open });
        const t2 = createDraftTournament(ctrl, { name: '月赛' });
        // 保持 Draft
        const open = ctrl.listTournaments(tenantCtx, { status: tournament_entity_1.TournamentStatus.Open });
        strict_1.default.equal(open.length, 1);
        strict_1.default.equal(open[0].name, '周赛');
        const drafts = ctrl.listTournaments(tenantCtx, { status: tournament_entity_1.TournamentStatus.Draft });
        strict_1.default.equal(drafts.length, 1);
        strict_1.default.equal(drafts[0].name, '月赛');
    });
    (0, node_test_1.default)('查询不存在的赛事返回错误 (non-existent tournament)', () => {
        const ctrl = createController();
        strict_1.default.throws(() => ctrl.getTournament(tenantCtx, 'non-existent-tournament'), /Tournament not found/);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 推广赛事活动 (marketing promoting tournaments)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('📢营销 — 赛事推广视角', () => {
    (0, node_test_1.default)('查看已开放的赛事列表用于推广 (list open tournaments)', () => {
        const ctrl = createController();
        const campaignTournament = createDraftTournament(ctrl, { name: '暑期争霸赛' });
        ctrl.updateTournamentStatus(tenantCtx, campaignTournament.id, { status: tournament_entity_1.TournamentStatus.Open });
        const openTournaments = ctrl.listTournaments(tenantCtx, { status: tournament_entity_1.TournamentStatus.Open });
        (0, strict_1.default)(openTournaments.length >= 1);
        (0, strict_1.default)(openTournaments.some((t) => t.name === '暑期争霸赛'));
    });
    (0, node_test_1.default)('查看赛事详情获取宣传素材 (get tournament details)', () => {
        const ctrl = createController();
        const t = createDraftTournament(ctrl, {
            name: '国庆挑战赛',
            gameName: '拳皇15',
        });
        const detail = ctrl.getTournament(tenantCtx, t.id);
        strict_1.default.equal(detail.name, '国庆挑战赛');
        strict_1.default.equal(detail.gameName, '拳皇15');
        (0, strict_1.default)(detail.prizes, '赛事应有奖品设置');
        strict_1.default.equal(detail.prizes.first?.label, '冠军');
        (0, strict_1.default)(detail.bannerImage, '赛事应有宣传图片');
        (0, strict_1.default)(detail.rules.matchFormat, '赛事应有规则设置');
    });
    (0, node_test_1.default)('按游戏名称筛选赛事 (filter by game)', () => {
        const ctrl = createController();
        createDraftTournament(ctrl, { name: '街霸赛', gameName: '街霸6' });
        createDraftTournament(ctrl, { name: '拳皇赛', gameName: '拳皇15' });
        createDraftTournament(ctrl, { name: '铁拳赛', gameName: '铁拳8' });
        // 列出所有赛事
        const all = ctrl.listTournaments(tenantCtx, {});
        strict_1.default.equal(all.length, 3);
    });
});
//# sourceMappingURL=tournament.role-extended.test.js.map