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
const campaign_dto_1 = require("./campaign.dto");
const campaign_entity_1 = require("./campaign.entity");
// ── CampaignConditionDto ──
(0, node_test_1.describe)('campaign.dto: CampaignConditionDto', () => {
    (0, node_test_1.default)('default properties are undefined', () => {
        const dto = new campaign_dto_1.CampaignConditionDto();
        strict_1.default.equal(dto.type, undefined);
        strict_1.default.equal(dto.value, undefined);
    });
    (0, node_test_1.default)('can set MIN_ORDER_AMOUNT condition (正例)', () => {
        const dto = new campaign_dto_1.CampaignConditionDto();
        dto.type = campaign_entity_1.CampaignConditionType.MinOrderAmount;
        dto.value = 100;
        strict_1.default.equal(dto.type, campaign_entity_1.CampaignConditionType.MinOrderAmount);
        strict_1.default.equal(dto.value, 100);
    });
    (0, node_test_1.default)('can set MEMBER_LEVEL condition with string value (正例)', () => {
        const dto = new campaign_dto_1.CampaignConditionDto();
        dto.type = campaign_entity_1.CampaignConditionType.MemberLevel;
        dto.value = 'GOLD';
        strict_1.default.equal(dto.type, campaign_entity_1.CampaignConditionType.MemberLevel);
        strict_1.default.equal(dto.value, 'GOLD');
    });
    (0, node_test_1.default)('can set STORE_SCOPE condition with string array value (正例)', () => {
        const dto = new campaign_dto_1.CampaignConditionDto();
        dto.type = campaign_entity_1.CampaignConditionType.StoreScope;
        dto.value = ['store-001', 'store-002'];
        strict_1.default.equal(dto.type, campaign_entity_1.CampaignConditionType.StoreScope);
        strict_1.default.deepStrictEqual(dto.value, ['store-001', 'store-002']);
    });
    (0, node_test_1.default)('can set BRAND_SCOPE condition (正例)', () => {
        const dto = new campaign_dto_1.CampaignConditionDto();
        dto.type = campaign_entity_1.CampaignConditionType.BrandScope;
        dto.value = 'brand-xyz';
        strict_1.default.equal(dto.type, campaign_entity_1.CampaignConditionType.BrandScope);
        strict_1.default.equal(dto.value, 'brand-xyz');
    });
    (0, node_test_1.default)('value supports number, string, and string[] (联合类型)', () => {
        const dto1 = new campaign_dto_1.CampaignConditionDto();
        dto1.value = 50;
        strict_1.default.equal(typeof dto1.value, 'number');
        const dto2 = new campaign_dto_1.CampaignConditionDto();
        dto2.value = 'VIP';
        strict_1.default.equal(typeof dto2.value, 'string');
        const dto3 = new campaign_dto_1.CampaignConditionDto();
        dto3.value = ['s1', 's2'];
        strict_1.default.ok(Array.isArray(dto3.value));
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new campaign_dto_1.CampaignConditionDto();
        strict_1.default.ok(dto instanceof campaign_dto_1.CampaignConditionDto);
    });
});
// ── CampaignActionDto ──
(0, node_test_1.describe)('campaign.dto: CampaignActionDto', () => {
    (0, node_test_1.default)('default properties are undefined', () => {
        const dto = new campaign_dto_1.CampaignActionDto();
        strict_1.default.equal(dto.kind, undefined);
        strict_1.default.equal(dto.params, undefined);
    });
    (0, node_test_1.default)('can set AWARD_POINTS action (正例)', () => {
        const dto = new campaign_dto_1.CampaignActionDto();
        dto.kind = campaign_entity_1.CampaignActionKind.AwardPoints;
        dto.params = { points: 100 };
        strict_1.default.equal(dto.kind, campaign_entity_1.CampaignActionKind.AwardPoints);
        strict_1.default.deepStrictEqual(dto.params, { points: 100 });
    });
    (0, node_test_1.default)('can set ISSUE_COUPON action (正例)', () => {
        const dto = new campaign_dto_1.CampaignActionDto();
        dto.kind = campaign_entity_1.CampaignActionKind.IssueCoupon;
        dto.params = { couponTemplateId: 'ct-001', discountType: 'PERCENTAGE', discountValue: 20 };
        strict_1.default.equal(dto.kind, campaign_entity_1.CampaignActionKind.IssueCoupon);
        strict_1.default.equal(dto.params.couponTemplateId, 'ct-001');
        strict_1.default.equal(dto.params.discountValue, 20);
    });
    (0, node_test_1.default)('can set ISSUE_BLINDBOX action (正例)', () => {
        const dto = new campaign_dto_1.CampaignActionDto();
        dto.kind = campaign_entity_1.CampaignActionKind.IssueBlindbox;
        dto.params = { blindboxPoolId: 'bp-001' };
        strict_1.default.equal(dto.kind, campaign_entity_1.CampaignActionKind.IssueBlindbox);
        strict_1.default.equal(dto.params.blindboxPoolId, 'bp-001');
    });
    (0, node_test_1.default)('can set RECOMMEND_TAG action (正例)', () => {
        const dto = new campaign_dto_1.CampaignActionDto();
        dto.kind = campaign_entity_1.CampaignActionKind.RecommendTag;
        dto.params = { tag: 'high_value' };
        strict_1.default.equal(dto.kind, campaign_entity_1.CampaignActionKind.RecommendTag);
        strict_1.default.equal(dto.params.tag, 'high_value');
    });
    (0, node_test_1.default)('params supports any object shape', () => {
        const dto = new campaign_dto_1.CampaignActionDto();
        dto.kind = campaign_entity_1.CampaignActionKind.AwardPoints;
        dto.params = { points: 50, expiresAt: '2026-12-31T23:59:59Z', reason: 'signup' };
        strict_1.default.equal(dto.params.points, 50);
        strict_1.default.equal(dto.params.reason, 'signup');
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new campaign_dto_1.CampaignActionDto();
        strict_1.default.ok(dto instanceof campaign_dto_1.CampaignActionDto);
    });
});
// ── RegisterCampaignDto ──
(0, node_test_1.describe)('campaign.dto: RegisterCampaignDto', () => {
    (0, node_test_1.default)('default properties are undefined', () => {
        const dto = new campaign_dto_1.RegisterCampaignDto();
        strict_1.default.equal(dto.code, undefined);
        strict_1.default.equal(dto.title, undefined);
        strict_1.default.equal(dto.description, undefined);
        strict_1.default.equal(dto.triggerEvent, undefined);
        strict_1.default.equal(dto.conditions, undefined);
        strict_1.default.equal(dto.actions, undefined);
        strict_1.default.equal(dto.priority, undefined);
        strict_1.default.equal(dto.scheduledStart, undefined);
        strict_1.default.equal(dto.scheduledEnd, undefined);
    });
    (0, node_test_1.default)('can register a complete campaign DTO (正例)', () => {
        const dto = new campaign_dto_1.RegisterCampaignDto();
        dto.code = 'WELCOME_BONUS';
        dto.title = '新会员欢迎奖励';
        dto.triggerEvent = campaign_entity_1.CampaignTrigger.PaymentSuccess;
        const cond = new campaign_dto_1.CampaignConditionDto();
        cond.type = campaign_entity_1.CampaignConditionType.MinOrderAmount;
        cond.value = 100;
        dto.conditions = [cond];
        const action = new campaign_dto_1.CampaignActionDto();
        action.kind = campaign_entity_1.CampaignActionKind.AwardPoints;
        action.params = { points: 200 };
        dto.actions = [action];
        strict_1.default.equal(dto.code, 'WELCOME_BONUS');
        strict_1.default.equal(dto.title, '新会员欢迎奖励');
        strict_1.default.equal(dto.triggerEvent, campaign_entity_1.CampaignTrigger.PaymentSuccess);
        strict_1.default.equal(dto.conditions.length, 1);
        strict_1.default.equal(dto.actions.length, 1);
    });
    (0, node_test_1.default)('can register campaign with optional description (边界)', () => {
        const dto = new campaign_dto_1.RegisterCampaignDto();
        dto.code = 'TEST_CAMPAIGN';
        dto.title = 'Test';
        dto.description = '测试描述';
        dto.triggerEvent = campaign_entity_1.CampaignTrigger.MemberProfileSynced;
        dto.conditions = [];
        dto.actions = [];
        strict_1.default.equal(dto.description, '测试描述');
    });
    (0, node_test_1.default)('description is optional - undefined is valid', () => {
        const dto = new campaign_dto_1.RegisterCampaignDto();
        dto.code = 'NO_DESC';
        dto.title = 'No Description';
        dto.triggerEvent = campaign_entity_1.CampaignTrigger.OrderCreated;
        dto.conditions = [];
        dto.actions = [];
        strict_1.default.equal(dto.description, undefined);
    });
    (0, node_test_1.default)('can register with multiple conditions and actions (正例)', () => {
        const dto = new campaign_dto_1.RegisterCampaignDto();
        dto.code = 'MULTI';
        dto.title = 'Multi conditions';
        const cond1 = new campaign_dto_1.CampaignConditionDto();
        cond1.type = campaign_entity_1.CampaignConditionType.MemberLevel;
        cond1.value = 'PLATINUM';
        const cond2 = new campaign_dto_1.CampaignConditionDto();
        cond2.type = campaign_entity_1.CampaignConditionType.MinOrderAmount;
        cond2.value = 500;
        dto.conditions = [cond1, cond2];
        const action1 = new campaign_dto_1.CampaignActionDto();
        action1.kind = campaign_entity_1.CampaignActionKind.AwardPoints;
        action1.params = { points: 300 };
        const action2 = new campaign_dto_1.CampaignActionDto();
        action2.kind = campaign_entity_1.CampaignActionKind.IssueCoupon;
        action2.params = { couponTemplateId: 'ct-002' };
        dto.actions = [action1, action2];
        dto.triggerEvent = campaign_entity_1.CampaignTrigger.MemberActivityRecurring;
        strict_1.default.equal(dto.conditions.length, 2);
        strict_1.default.equal(dto.actions.length, 2);
    });
    (0, node_test_1.default)('can set scheduled time range (正例)', () => {
        const dto = new campaign_dto_1.RegisterCampaignDto();
        dto.code = 'SCHEDULED_CAMPAIGN';
        dto.title = 'Scheduled';
        dto.triggerEvent = campaign_entity_1.CampaignTrigger.PaymentSuccess;
        dto.conditions = [];
        dto.actions = [];
        dto.scheduledStart = '2026-07-01T00:00:00Z';
        dto.scheduledEnd = '2026-07-31T23:59:59Z';
        dto.priority = 10;
        strict_1.default.equal(dto.scheduledStart, '2026-07-01T00:00:00Z');
        strict_1.default.equal(dto.scheduledEnd, '2026-07-31T23:59:59Z');
        strict_1.default.equal(dto.priority, 10);
    });
    (0, node_test_1.default)('scheduledStart and scheduledEnd are optional (边界)', () => {
        const dto = new campaign_dto_1.RegisterCampaignDto();
        dto.code = 'NO_SCHEDULE';
        dto.title = 'No Schedule';
        dto.triggerEvent = campaign_entity_1.CampaignTrigger.PaymentSuccess;
        dto.conditions = [];
        dto.actions = [];
        strict_1.default.equal(dto.scheduledStart, undefined);
        strict_1.default.equal(dto.scheduledEnd, undefined);
    });
    (0, node_test_1.default)('priority defaults to undefined (边界)', () => {
        const dto = new campaign_dto_1.RegisterCampaignDto();
        dto.code = 'NO_PRIORITY';
        dto.title = 'No Priority';
        dto.triggerEvent = campaign_entity_1.CampaignTrigger.PaymentSuccess;
        dto.conditions = [];
        dto.actions = [];
        strict_1.default.equal(dto.priority, undefined);
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new campaign_dto_1.RegisterCampaignDto();
        strict_1.default.ok(dto instanceof campaign_dto_1.RegisterCampaignDto);
    });
});
// ── UpdateCampaignStatusDto ──
(0, node_test_1.describe)('campaign.dto: UpdateCampaignStatusDto', () => {
    (0, node_test_1.default)('default status is undefined', () => {
        const dto = new campaign_dto_1.UpdateCampaignStatusDto();
        strict_1.default.equal(dto.status, undefined);
    });
    (0, node_test_1.default)('can set DRAFT status (正例)', () => {
        const dto = new campaign_dto_1.UpdateCampaignStatusDto();
        dto.status = campaign_entity_1.CampaignStatus.Draft;
        strict_1.default.equal(dto.status, campaign_entity_1.CampaignStatus.Draft);
    });
    (0, node_test_1.default)('can set ACTIVE status (正例)', () => {
        const dto = new campaign_dto_1.UpdateCampaignStatusDto();
        dto.status = campaign_entity_1.CampaignStatus.Active;
        strict_1.default.equal(dto.status, campaign_entity_1.CampaignStatus.Active);
    });
    (0, node_test_1.default)('can set PAUSED status (正例)', () => {
        const dto = new campaign_dto_1.UpdateCampaignStatusDto();
        dto.status = campaign_entity_1.CampaignStatus.Paused;
        strict_1.default.equal(dto.status, campaign_entity_1.CampaignStatus.Paused);
    });
    (0, node_test_1.default)('can set COMPLETED status (正例)', () => {
        const dto = new campaign_dto_1.UpdateCampaignStatusDto();
        dto.status = campaign_entity_1.CampaignStatus.Completed;
        strict_1.default.equal(dto.status, campaign_entity_1.CampaignStatus.Completed);
    });
    (0, node_test_1.default)('can set SCHEDULED status (正例)', () => {
        const dto = new campaign_dto_1.UpdateCampaignStatusDto();
        dto.status = campaign_entity_1.CampaignStatus.Scheduled;
        strict_1.default.equal(dto.status, campaign_entity_1.CampaignStatus.Scheduled);
    });
    (0, node_test_1.default)('status is a required field in DTO (反例 - 未设置时 undefined)', () => {
        const dto = new campaign_dto_1.UpdateCampaignStatusDto();
        strict_1.default.equal(dto.status, undefined);
        // 验证 DTO 构造，设置后才有效
        dto.status = campaign_entity_1.CampaignStatus.Draft;
        strict_1.default.notEqual(dto.status, undefined);
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new campaign_dto_1.UpdateCampaignStatusDto();
        strict_1.default.ok(dto instanceof campaign_dto_1.UpdateCampaignStatusDto);
    });
});
//# sourceMappingURL=campaign.dto.test.js.map