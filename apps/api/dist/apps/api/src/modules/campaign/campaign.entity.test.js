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
const campaign_entity_1 = require("./campaign.entity");
(0, node_test_1.describe)('CampaignEntity', () => {
    (0, node_test_1.default)('campaign trigger and status enums are stable', () => {
        strict_1.default.equal(campaign_entity_1.CampaignTrigger.PaymentSuccess, 'payment.success');
        strict_1.default.equal(campaign_entity_1.CampaignTrigger.MemberProfileSynced, 'member.profile-synced');
        strict_1.default.equal(campaign_entity_1.CampaignStatus.Draft, 'DRAFT');
        strict_1.default.equal(campaign_entity_1.CampaignStatus.Scheduled, 'SCHEDULED');
        strict_1.default.equal(campaign_entity_1.CampaignStatus.Active, 'ACTIVE');
        strict_1.default.equal(campaign_entity_1.CampaignStatus.Paused, 'PAUSED');
        strict_1.default.equal(campaign_entity_1.CampaignStatus.Completed, 'COMPLETED');
        strict_1.default.equal(campaign_entity_1.CampaignActionStatus.Dispatched, 'DISPATCHED');
        strict_1.default.equal(campaign_entity_1.CampaignActionStatus.Failed, 'FAILED');
        strict_1.default.equal(campaign_entity_1.CampaignActionStatus.Skipped, 'SKIPPED');
        strict_1.default.equal(campaign_entity_1.CampaignActionStatus.Pending, 'PENDING');
    });
    (0, node_test_1.default)('campaign action and condition enums cover full matrix', () => {
        const actionKinds = Object.values(campaign_entity_1.CampaignActionKind);
        strict_1.default.deepEqual(actionKinds.sort(), ['AWARD_POINTS', 'ISSUE_BLINDBOX', 'ISSUE_COUPON', 'RECOMMEND_TAG']);
        const conditionTypes = Object.values(campaign_entity_1.CampaignConditionType);
        strict_1.default.deepEqual(conditionTypes.sort(), ['BRAND_SCOPE', 'MEMBER_LEVEL', 'MIN_ORDER_AMOUNT', 'STORE_SCOPE']);
    });
    (0, node_test_1.default)('campaign condition and action types can be expressed structurally', () => {
        const condition = {
            type: campaign_entity_1.CampaignConditionType.MinOrderAmount,
            value: 100
        };
        const action = {
            kind: campaign_entity_1.CampaignActionKind.AwardPoints,
            params: { pointsAmount: 50, pointsReason: 'test' }
        };
        strict_1.default.equal(condition.type, 'MIN_ORDER_AMOUNT');
        strict_1.default.equal(condition.value, 100);
        strict_1.default.equal(action.kind, 'AWARD_POINTS');
        strict_1.default.equal(action.params.pointsAmount, 50);
    });
});
//# sourceMappingURL=campaign.entity.test.js.map