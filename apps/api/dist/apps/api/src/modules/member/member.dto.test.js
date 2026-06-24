"use strict";
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
const member_dto_1 = require("./member.dto");
const member_entity_1 = require("./member.entity");
// ── MemberQueryDto ─────────────────────────────────────────────
(0, node_test_1.describe)('member.dto: MemberQueryDto', () => {
    (0, node_test_1.default)('default properties are undefined', () => {
        const dto = new member_dto_1.MemberQueryDto();
        strict_1.default.equal(dto.level, undefined);
        strict_1.default.equal(dto.status, undefined);
        strict_1.default.equal(dto.keyword, undefined);
        strict_1.default.equal(dto.page, undefined);
        strict_1.default.equal(dto.pageSize, undefined);
    });
    (0, node_test_1.default)('can set level filter', () => {
        const dto = new member_dto_1.MemberQueryDto();
        dto.level = member_entity_1.MemberLevel.Gold;
        strict_1.default.equal(dto.level, 'GOLD');
    });
    (0, node_test_1.default)('can set status filter', () => {
        const dto = new member_dto_1.MemberQueryDto();
        dto.status = member_entity_1.MemberStatus.Active;
        strict_1.default.equal(dto.status, 'ACTIVE');
    });
    (0, node_test_1.default)('can set keyword search', () => {
        const dto = new member_dto_1.MemberQueryDto();
        dto.keyword = 'test-user';
        strict_1.default.equal(dto.keyword, 'test-user');
    });
    (0, node_test_1.default)('can set pagination', () => {
        const dto = new member_dto_1.MemberQueryDto();
        dto.page = 1;
        dto.pageSize = 20;
        strict_1.default.equal(dto.page, 1);
        strict_1.default.equal(dto.pageSize, 20);
    });
    (0, node_test_1.default)('can set all properties', () => {
        const dto = new member_dto_1.MemberQueryDto();
        dto.level = member_entity_1.MemberLevel.Silver;
        dto.status = member_entity_1.MemberStatus.Frozen;
        dto.keyword = 'vip';
        dto.page = 2;
        dto.pageSize = 50;
        strict_1.default.equal(dto.level, 'SILVER');
        strict_1.default.equal(dto.status, 'FROZEN');
        strict_1.default.equal(dto.keyword, 'vip');
        strict_1.default.equal(dto.page, 2);
        strict_1.default.equal(dto.pageSize, 50);
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new member_dto_1.MemberQueryDto();
        strict_1.default.ok(dto instanceof member_dto_1.MemberQueryDto);
    });
});
// ── MemberCreateDto ────────────────────────────────────────────
(0, node_test_1.describe)('member.dto: MemberCreateDto', () => {
    (0, node_test_1.default)('requires nickname property', () => {
        const dto = new member_dto_1.MemberCreateDto();
        dto.nickname = 'NewUser';
        strict_1.default.equal(dto.nickname, 'NewUser');
    });
    (0, node_test_1.default)('points defaults to undefined', () => {
        const dto = new member_dto_1.MemberCreateDto();
        dto.nickname = 'Test';
        strict_1.default.equal(dto.points, undefined);
    });
    (0, node_test_1.default)('can set initial points', () => {
        const dto = new member_dto_1.MemberCreateDto();
        dto.nickname = 'VIP';
        dto.points = 100;
        strict_1.default.equal(dto.points, 100);
    });
    (0, node_test_1.default)('can set initial level', () => {
        const dto = new member_dto_1.MemberCreateDto();
        dto.nickname = 'GoldUser';
        dto.level = member_entity_1.MemberLevel.Gold;
        strict_1.default.equal(dto.level, 'GOLD');
    });
    (0, node_test_1.default)('can set all create properties', () => {
        const dto = new member_dto_1.MemberCreateDto();
        dto.nickname = 'FullUser';
        dto.points = 5000;
        dto.level = member_entity_1.MemberLevel.Platinum;
        strict_1.default.equal(dto.nickname, 'FullUser');
        strict_1.default.equal(dto.points, 5000);
        strict_1.default.equal(dto.level, 'PLATINUM');
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new member_dto_1.MemberCreateDto();
        strict_1.default.ok(dto instanceof member_dto_1.MemberCreateDto);
    });
});
// ── MemberUpdateDto ────────────────────────────────────────────
(0, node_test_1.describe)('member.dto: MemberUpdateDto', () => {
    (0, node_test_1.default)('all properties default to undefined', () => {
        const dto = new member_dto_1.MemberUpdateDto();
        strict_1.default.equal(dto.nickname, undefined);
        strict_1.default.equal(dto.level, undefined);
        strict_1.default.equal(dto.status, undefined);
        strict_1.default.equal(dto.pointsDelta, undefined);
    });
    (0, node_test_1.default)('can update nickname', () => {
        const dto = new member_dto_1.MemberUpdateDto();
        dto.nickname = 'UpdatedName';
        strict_1.default.equal(dto.nickname, 'UpdatedName');
    });
    (0, node_test_1.default)('can update level', () => {
        const dto = new member_dto_1.MemberUpdateDto();
        dto.level = member_entity_1.MemberLevel.Diamond;
        strict_1.default.equal(dto.level, 'DIAMOND');
    });
    (0, node_test_1.default)('can update status', () => {
        const dto = new member_dto_1.MemberUpdateDto();
        dto.status = member_entity_1.MemberStatus.Blacklisted;
        strict_1.default.equal(dto.status, 'BLACKLISTED');
    });
    (0, node_test_1.default)('can apply positive pointsDelta', () => {
        const dto = new member_dto_1.MemberUpdateDto();
        dto.pointsDelta = 200;
        strict_1.default.equal(dto.pointsDelta, 200);
    });
    (0, node_test_1.default)('can apply negative pointsDelta (deduction)', () => {
        const dto = new member_dto_1.MemberUpdateDto();
        dto.pointsDelta = -50;
        strict_1.default.equal(dto.pointsDelta, -50);
    });
    (0, node_test_1.default)('can apply zero pointsDelta', () => {
        const dto = new member_dto_1.MemberUpdateDto();
        dto.pointsDelta = 0;
        strict_1.default.equal(dto.pointsDelta, 0);
    });
    (0, node_test_1.default)('can set multiple update fields', () => {
        const dto = new member_dto_1.MemberUpdateDto();
        dto.nickname = 'MultiUpdate';
        dto.level = member_entity_1.MemberLevel.Silver;
        dto.status = member_entity_1.MemberStatus.Frozen;
        dto.pointsDelta = -100;
        strict_1.default.equal(dto.nickname, 'MultiUpdate');
        strict_1.default.equal(dto.level, 'SILVER');
        strict_1.default.equal(dto.status, 'FROZEN');
        strict_1.default.equal(dto.pointsDelta, -100);
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new member_dto_1.MemberUpdateDto();
        strict_1.default.ok(dto instanceof member_dto_1.MemberUpdateDto);
    });
});
// ── MemberBootstrapResponseDto ─────────────────────────────────
(0, node_test_1.describe)('member.dto: MemberBootstrapResponseDto', () => {
    (0, node_test_1.default)('can set tenant context', () => {
        const dto = new member_dto_1.MemberBootstrapResponseDto();
        dto.tenantContext = { tenantId: 't-1', brandId: 'b-1' };
        strict_1.default.deepEqual(dto.tenantContext, { tenantId: 't-1', brandId: 'b-1' });
    });
    (0, node_test_1.default)('can set capabilities array', () => {
        const dto = new member_dto_1.MemberBootstrapResponseDto();
        dto.capabilities = ['member-center', 'points'];
        strict_1.default.deepEqual(dto.capabilities, ['member-center', 'points']);
    });
    (0, node_test_1.default)('can set phase', () => {
        const dto = new member_dto_1.MemberBootstrapResponseDto();
        dto.phase = 'scaffold';
        strict_1.default.equal(dto.phase, 'scaffold');
    });
    (0, node_test_1.default)('can set all fields', () => {
        const dto = new member_dto_1.MemberBootstrapResponseDto();
        dto.tenantContext = { tenantId: 't-full' };
        dto.capabilities = ['member-center', 'points', 'svip', 'blind-box'];
        dto.phase = 'scaffold';
        strict_1.default.equal(dto.phase, 'scaffold');
        strict_1.default.equal(dto.capabilities.length, 4);
        strict_1.default.equal(dto.tenantContext.tenantId, 't-full');
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new member_dto_1.MemberBootstrapResponseDto();
        strict_1.default.ok(dto instanceof member_dto_1.MemberBootstrapResponseDto);
    });
});
(0, node_test_1.describe)('member.dto: MemberPersistentRegisterDto', () => {
    (0, node_test_1.default)('can assign persistent register fields', () => {
        const dto = new member_dto_1.MemberPersistentRegisterDto();
        dto.mobile = '13800000000';
        dto.nickname = 'Persistent User';
        dto.initialPoints = 200;
        strict_1.default.equal(dto.mobile, '13800000000');
        strict_1.default.equal(dto.nickname, 'Persistent User');
        strict_1.default.equal(dto.initialPoints, 200);
    });
});
(0, node_test_1.describe)('member.dto: MemberLoginDto', () => {
    (0, node_test_1.default)('can assign login mobile', () => {
        const dto = new member_dto_1.MemberLoginDto();
        dto.mobile = '13900000000';
        strict_1.default.equal(dto.mobile, '13900000000');
    });
});
(0, node_test_1.describe)('member.dto: MemberPointsAdjustDto', () => {
    (0, node_test_1.default)('can assign points delta for controller actions', () => {
        const dto = new member_dto_1.MemberPointsAdjustDto();
        dto.points = 300;
        dto.approvalTicket = 'APR-POINTS-001';
        strict_1.default.equal(dto.points, 300);
        strict_1.default.equal(dto.approvalTicket, 'APR-POINTS-001');
    });
});
(0, node_test_1.describe)('member.dto: MemberPaymentActivityDto', () => {
    (0, node_test_1.default)('can assign payment activity fields', () => {
        const dto = new member_dto_1.MemberPaymentActivityDto();
        dto.orderId = 'order-001';
        dto.amount = 88;
        dto.paidAt = '2026-06-18T10:00:00.000Z';
        dto.channel = 'wechat-pay';
        dto.source = 'cashier';
        strict_1.default.equal(dto.orderId, 'order-001');
        strict_1.default.equal(dto.amount, 88);
        strict_1.default.equal(dto.paidAt, '2026-06-18T10:00:00.000Z');
        strict_1.default.equal(dto.channel, 'wechat-pay');
        strict_1.default.equal(dto.source, 'cashier');
    });
});
(0, node_test_1.describe)('member.dto: MemberStatusAdjustDto', () => {
    (0, node_test_1.default)('can assign target member status', () => {
        const dto = new member_dto_1.MemberStatusAdjustDto();
        dto.status = member_entity_1.MemberStatus.Blacklisted;
        dto.approvalTicket = 'APR-STATUS-001';
        strict_1.default.equal(dto.status, 'BLACKLISTED');
        strict_1.default.equal(dto.approvalTicket, 'APR-STATUS-001');
    });
});
(0, node_test_1.describe)('member.dto: MemberLevelAdjustDto', () => {
    (0, node_test_1.default)('can assign target member level', () => {
        const dto = new member_dto_1.MemberLevelAdjustDto();
        dto.level = member_entity_1.MemberLevel.Platinum;
        dto.approvalTicket = 'APR-LEVEL-001';
        strict_1.default.equal(dto.level, 'PLATINUM');
        strict_1.default.equal(dto.approvalTicket, 'APR-LEVEL-001');
    });
});
(0, node_test_1.describe)('member.dto: MemberPersistentProfileUpdateDto', () => {
    (0, node_test_1.default)('can assign persisted profile edit fields', () => {
        const dto = new member_dto_1.MemberPersistentProfileUpdateDto();
        dto.nickname = '资料更新用户';
        dto.mobile = '13800138000';
        dto.email = 'member@example.com';
        dto.address = '深圳市南山区科技园';
        dto.notes = '重点跟进会员';
        strict_1.default.equal(dto.nickname, '资料更新用户');
        strict_1.default.equal(dto.mobile, '13800138000');
        strict_1.default.equal(dto.email, 'member@example.com');
        strict_1.default.equal(dto.address, '深圳市南山区科技园');
        strict_1.default.equal(dto.notes, '重点跟进会员');
    });
});
//# sourceMappingURL=member.dto.test.js.map