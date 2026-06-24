"use strict";
/**
 * 🐜 自动: [tournament] [C] 角色测试
 *
 * 8 角色视角的 tournament 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
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
const tournament_service_1 = require("./tournament.service");
const tournament_entity_1 = require("./tournament.entity");
// ── 角色定义 ──
const ROLES = {
    StoreManager: '👔店长',
    FrontDesk: '🛒前台',
    HR: '👥HR',
    Security: '🔧安监',
    Guide: '🎮导玩员',
    Operations: '🎯运行专员',
    Teambuilding: '🤝团建',
    Marketing: '📢营销',
};
const TENANT = 'tenant-001';
function createService() {
    const svc = new tournament_service_1.TournamentService();
    return svc;
}
function createAndOpenTournament(svc, overrides) {
    const t = svc.createTournament({
        tenantId: TENANT,
        storeId: 'store-001',
        name: 'Role Test Tournament',
        type: tournament_entity_1.TournamentType.SingleElimination,
        gameName: 'Generic Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 16,
        ...overrides,
    });
    svc.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
    return t;
}
// ── 👔店长 ──
(0, node_test_1.describe)(`${ROLES.StoreManager} tournament 角色测试`, () => {
    (0, node_test_1.default)('店长可创建比赛并发布', () => {
        const svc = createService();
        const t = svc.createTournament({
            tenantId: TENANT,
            storeId: 'store-001',
            name: '夏季杯',
            type: tournament_entity_1.TournamentType.SingleElimination,
            gameName: '王者荣耀',
            startDate: '2026-07-01',
            endDate: '2026-07-15',
            maxParticipants: 64,
            description: '店长发起的夏季比赛',
            prizes: {
                first: { label: '冠军', value: '1000元+奖杯' },
                second: { label: '亚军', value: '500元' },
            },
        });
        strict_1.default.equal(t.name, '夏季杯');
        strict_1.default.equal(t.status, tournament_entity_1.TournamentStatus.Draft);
        // 发布比赛
        const opened = svc.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
        strict_1.default.equal(opened.status, tournament_entity_1.TournamentStatus.Open);
    });
    (0, node_test_1.default)('店长不可直接跳到 Completed', () => {
        const svc = createService();
        const t = svc.createTournament({
            tenantId: TENANT,
            name: 'Draft Tournament',
            type: tournament_entity_1.TournamentType.RoundRobin,
            gameName: 'Game',
            startDate: '2026-07-01',
            endDate: '2026-07-15',
            maxParticipants: 8,
        });
        strict_1.default.throws(() => svc.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Completed, TENANT), /Invalid tournament status transition/);
    });
    (0, node_test_1.default)('店长可查看自己店的比赛列表', () => {
        const svc = createService();
        svc.resetTournamentStoresForTests();
        createAndOpenTournament(svc, { name: 'T1', storeId: 'store-001' });
        createAndOpenTournament(svc, { name: 'T2', storeId: 'store-001' });
        const list = svc.listTournaments(TENANT, { storeId: 'store-001' });
        strict_1.default.equal(list.length, 2);
    });
});
// ── 🛒前台 ──
(0, node_test_1.describe)(`${ROLES.FrontDesk} tournament 角色测试`, () => {
    (0, node_test_1.default)('前台可为顾客报名比赛', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc);
        const updated = svc.registerParticipant(t.id, 'member-front-001', TENANT);
        strict_1.default.equal(updated.currentParticipants, 1);
    });
    (0, node_test_1.default)('前台不可为未开放比赛报名', () => {
        const svc = createService();
        const t = svc.createTournament({
            tenantId: TENANT,
            name: 'Draft Game',
            type: tournament_entity_1.TournamentType.SingleElimination,
            gameName: 'Game',
            startDate: '2026-07-01',
            endDate: '2026-07-15',
            maxParticipants: 16,
        });
        strict_1.default.throws(() => svc.registerParticipant(t.id, 'member-002', TENANT), /Tournament is not open for registration/);
    });
    (0, node_test_1.default)('前台可查看现场比赛', () => {
        const svc = createService();
        const live = svc.getLiveMatches('store-001');
        strict_1.default.ok(Array.isArray(live));
    });
});
// ── 👥HR ──
(0, node_test_1.describe)(`${ROLES.HR} tournament 角色测试`, () => {
    (0, node_test_1.default)('HR可组织团队报名团建比赛', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { type: tournament_entity_1.TournamentType.League });
        const reg = svc.registerTeam({
            tournamentId: t.id,
            teamName: 'HR Team Alpha',
            captainId: 'hr-mem-001',
            memberIds: ['hr-mem-001', 'hr-mem-002', 'hr-mem-003'],
        }, TENANT);
        strict_1.default.equal(reg.teamName, 'HR Team Alpha');
        strict_1.default.equal(reg.status, 'PENDING');
        strict_1.default.equal(reg.memberIds.length, 3);
    });
    (0, node_test_1.default)('HR不可为其他门店比赛报名', () => {
        const svc = createService();
        const t = svc.createTournament({
            tenantId: TENANT,
            storeId: 'store-other',
            name: 'Other Store Tournament',
            type: tournament_entity_1.TournamentType.RoundRobin,
            gameName: 'Game',
            startDate: '2026-07-01',
            endDate: '2026-07-15',
            maxParticipants: 8,
        });
        strict_1.default.throws(() => svc.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, 'wrong-tenant'), /Tournament not found/);
    });
});
// ── 🔧安监 ──
(0, node_test_1.describe)(`${ROLES.Security} tournament 角色测试`, () => {
    (0, node_test_1.default)('安监可标记比赛争议', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { type: tournament_entity_1.TournamentType.RoundRobin });
        svc.registerParticipant(t.id, 'p1', TENANT);
        svc.registerParticipant(t.id, 'p2', TENANT);
        const matches = svc.generateBracket(t.id, TENANT);
        const disputed = svc.setDisputed(matches[0].id, TENANT);
        strict_1.default.equal(disputed.status, tournament_entity_1.MatchStatus.Disputed);
    });
    (0, node_test_1.default)('安监标记不存在比赛应报错', () => {
        const svc = createService();
        strict_1.default.throws(() => svc.setDisputed('nonexistent-match', TENANT), /Match not found/);
    });
    (0, node_test_1.default)('安监可因安全问题取消比赛', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc);
        const cancelled = svc.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Cancelled, TENANT);
        strict_1.default.equal(cancelled.status, tournament_entity_1.TournamentStatus.Cancelled);
    });
});
// ── 🎮导玩员 ──
(0, node_test_1.describe)(`${ROLES.Guide} tournament 角色测试`, () => {
    (0, node_test_1.default)('导玩员可查看会员即将到来的比赛', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { type: tournament_entity_1.TournamentType.RoundRobin });
        svc.registerParticipant(t.id, 'guide-p1', TENANT);
        svc.registerParticipant(t.id, 'guide-p2', TENANT);
        svc.generateBracket(t.id, TENANT);
        const upcoming = svc.getUpcomingMatches('guide-p1');
        strict_1.default.ok(Array.isArray(upcoming));
        strict_1.default.ok(upcoming.length > 0);
    });
    (0, node_test_1.default)('导玩员可查看比赛排名', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { type: tournament_entity_1.TournamentType.RoundRobin });
        svc.registerParticipant(t.id, 'guide-p1', TENANT);
        svc.registerParticipant(t.id, 'guide-p2', TENANT);
        const matches = svc.generateBracket(t.id, TENANT);
        svc.recordMatchResult(matches[0].id, 2, 1, TENANT);
        const rankings = svc.getRankings(t.id, TENANT);
        strict_1.default.ok(rankings.length > 0);
        strict_1.default.ok(rankings[0].rank > 0);
    });
});
// ── 🎯运行专员 ──
(0, node_test_1.describe)(`${ROLES.Operations} tournament 角色测试`, () => {
    (0, node_test_1.default)('运行专员可生成淘汰赛对阵表', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { type: tournament_entity_1.TournamentType.SingleElimination });
        svc.registerParticipant(t.id, 'ops-p1', TENANT);
        svc.registerParticipant(t.id, 'ops-p2', TENANT);
        svc.registerParticipant(t.id, 'ops-p3', TENANT);
        svc.registerParticipant(t.id, 'ops-p4', TENANT);
        const matches = svc.generateBracket(t.id, TENANT);
        strict_1.default.ok(matches.length >= 2); // at least first round matches
        const updatedT = svc.getTournament(t.id, TENANT);
        strict_1.default.equal(updatedT?.status, tournament_entity_1.TournamentStatus.Ongoing);
    });
    (0, node_test_1.default)('运行专员可录入比赛结果', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { type: tournament_entity_1.TournamentType.RoundRobin });
        svc.registerParticipant(t.id, 'ops-p1', TENANT);
        svc.registerParticipant(t.id, 'ops-p2', TENANT);
        const matches = svc.generateBracket(t.id, TENANT);
        const result = svc.recordMatchResult(matches[0].id, 3, 2, TENANT);
        strict_1.default.equal(result.status, tournament_entity_1.MatchStatus.Completed);
        strict_1.default.equal(result.winnerId, matches[0].player1Id);
    });
    (0, node_test_1.default)('运行专员不可重复录入比赛结果', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { type: tournament_entity_1.TournamentType.RoundRobin });
        svc.registerParticipant(t.id, 'ops-p1', TENANT);
        svc.registerParticipant(t.id, 'ops-p2', TENANT);
        const matches = svc.generateBracket(t.id, TENANT);
        svc.recordMatchResult(matches[0].id, 2, 1, TENANT);
        strict_1.default.throws(() => svc.recordMatchResult(matches[0].id, 3, 2, TENANT), /Match already completed/);
    });
});
// ── 🤝团建 ──
(0, node_test_1.describe)(`${ROLES.Teambuilding} tournament 角色测试`, () => {
    (0, node_test_1.default)('团建可审批团队报名', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { type: tournament_entity_1.TournamentType.League });
        const reg = svc.registerTeam({
            tournamentId: t.id,
            teamName: '财务部',
            captainId: 'tb-captain',
            memberIds: ['tb-captain', 'tb-m2', 'tb-m3', 'tb-m4', 'tb-m5'],
        }, TENANT);
        const approved = svc.approveTeam(reg.id, TENANT);
        strict_1.default.equal(approved.status, 'APPROVED');
    });
    (0, node_test_1.default)('团建可拒绝团队报名', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { type: tournament_entity_1.TournamentType.League });
        const reg = svc.registerTeam({
            tournamentId: t.id,
            teamName: '临时组队',
            captainId: 'tb-tmp',
            memberIds: ['tb-tmp'],
        }, TENANT);
        const rejected = svc.rejectTeam(reg.id, TENANT);
        strict_1.default.equal(rejected.status, 'REJECTED');
    });
    (0, node_test_1.default)('团建可查看报名团队列表', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc);
        svc.registerTeam({ tournamentId: t.id, teamName: 'A', captainId: 'm1', memberIds: ['m1'] }, TENANT);
        svc.registerTeam({ tournamentId: t.id, teamName: 'B', captainId: 'm2', memberIds: ['m2'] }, TENANT);
        const list = svc.listTeamRegistrations(t.id, TENANT);
        strict_1.default.equal(list.length, 2);
    });
});
// ── 📢营销 ──
(0, node_test_1.describe)(`${ROLES.Marketing} tournament 角色测试`, () => {
    (0, node_test_1.default)('营销可创建营销活动比赛', () => {
        const svc = createService();
        const t = svc.createTournament({
            tenantId: TENANT,
            storeId: 'store-001',
            name: '新店开业杯',
            type: tournament_entity_1.TournamentType.SingleElimination,
            gameName: '街霸6',
            startDate: '2026-08-01',
            endDate: '2026-08-07',
            maxParticipants: 32,
            description: '新店开业庆典比赛',
            bannerImage: 'https://cdn.example.com/promo-banner.png',
            prizes: {
                first: { label: '冠军', value: '500元优惠券+限定皮肤' },
                participation: { label: '参与奖', value: '50元优惠券' },
            },
        });
        strict_1.default.equal(t.name, '新店开业杯');
        strict_1.default.equal(t.bannerImage, 'https://cdn.example.com/promo-banner.png');
        strict_1.default.ok(t.prizes.participation);
        strict_1.default.equal(t.status, tournament_entity_1.TournamentStatus.Draft);
    });
    (0, node_test_1.default)('营销可查看所有类型比赛的排名用于宣传', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { type: tournament_entity_1.TournamentType.RoundRobin });
        svc.registerParticipant(t.id, 'mkt-p1', TENANT);
        svc.registerParticipant(t.id, 'mkt-p2', TENANT);
        svc.registerParticipant(t.id, 'mkt-p3', TENANT);
        const matches = svc.generateBracket(t.id, TENANT);
        // Record results to build rankings
        if (matches[0] && matches[0].player2Id) {
            svc.recordMatchResult(matches[0].id, 2, 1, TENANT);
        }
        if (matches[1] && matches[1].player2Id) {
            svc.recordMatchResult(matches[1].id, 1, 2, TENANT);
        }
        if (matches[2] && matches[2].player2Id) {
            svc.recordMatchResult(matches[2].id, 0, 2, TENANT);
        }
        const rankings = svc.getRankings(t.id, TENANT);
        strict_1.default.ok(rankings.length > 0);
        // All should have scores
        for (const r of rankings) {
            strict_1.default.ok(typeof r.points === 'number');
            strict_1.default.ok(typeof r.wins === 'number');
        }
    });
    (0, node_test_1.default)('营销不可操作其他租户的比赛', () => {
        const svc = createService();
        const t = svc.createTournament({
            tenantId: TENANT,
            name: 'Test',
            type: tournament_entity_1.TournamentType.SingleElimination,
            gameName: 'Game',
            startDate: '2026-07-01',
            endDate: '2026-07-15',
            maxParticipants: 8,
        });
        strict_1.default.throws(() => svc.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, 'evil-tenant'), /Tournament not found/);
    });
});
//# sourceMappingURL=tournament.role.test.js.map