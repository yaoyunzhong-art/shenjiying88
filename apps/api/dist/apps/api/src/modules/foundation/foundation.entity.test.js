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
// Test that foundation entity types are structurally sound
(0, node_test_1.describe)('foundation entity 类型验证', () => {
    (0, node_test_1.default)('FoundationAlertMutationResponse 结构', () => {
        const resp = {
            generatedAt: '2026-01-01T00:00:00.000Z',
            code: 'observability-degradation',
            catalog: {
                code: 'observability-degradation',
                defaultSummary: 'observability 降级',
                severityPolicy: 'auto',
                sourceModules: ['resilience-operations'],
                drilldownEnabled: true,
                acknowledgementEnabled: true,
                drilldownPath: '/foundation/overview/alerts/observability-degradation/drilldown',
                ackPath: '/foundation/overview/alerts/observability-degradation/ack',
                mutePath: '/foundation/overview/alerts/observability-degradation/mute',
                unmutePath: '/foundation/overview/alerts/observability-degradation/unmute',
                acknowledgementStatus: 'ACKED',
                visibleInOverview: true,
                latestHistoryAction: 'ACK',
                availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
            },
            acknowledgement: {
                status: 'ACKED',
                acknowledgedAt: '2026-01-01T00:00:00.000Z',
                mutedUntil: null,
                note: '已确认',
                actorId: 'actor-1'
            },
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
            history: []
        };
        strict_1.default.equal(resp.code, 'observability-degradation');
        strict_1.default.equal(resp.acknowledgement.status, 'ACKED');
        strict_1.default.equal(resp.visibleInOverview, true);
        strict_1.default.ok(Array.isArray(resp.availableActions));
    });
    (0, node_test_1.default)('FoundationBootstrapResponse 结构', () => {
        const resp = {
            tenantContext: { tenantId: 't-1', brandId: 'b-1' },
            generatedAt: '2026-01-01T00:00:00.000Z',
            docs: ['foundation-architecture.md'],
            guardrails: ['不得绕过底座'],
            frontendBootstrap: {},
            modules: [{ module: 'trust-governance', status: 'healthy' }],
            consumers: [{ consumer: 'market' }],
            governanceBaselines: []
        };
        strict_1.default.ok(Array.isArray(resp.docs));
        strict_1.default.ok(Array.isArray(resp.guardrails));
        strict_1.default.equal(resp.docs.length, 1);
        strict_1.default.equal(resp.guardrails[0], '不得绕过底座');
    });
    (0, node_test_1.default)('FoundationOperationsAlertSummary 结构', () => {
        const summary = {
            generatedAt: '2026-01-01T00:00:00.000Z',
            summary: {
                approvalsPending: 3,
                approvalsWithFailures: 1,
                highRiskAudits: 2
            },
            alerts: [],
            topRisks: [],
            topFailures: [{ module: 'trust-governance', label: '审批失败', count: 1 }],
            moduleHealth: {
                'trust-governance': {
                    module: 'trust-governance',
                    score: 85,
                    status: 'healthy',
                    indicators: { highRiskAudits: 0, pendingApprovals: 1, executionFailures: 0, blockedCount: 0 }
                }
            },
            modules: {}
        };
        strict_1.default.equal(summary.summary.approvalsPending, 3);
        strict_1.default.equal(summary.moduleHealth['trust-governance'].status, 'healthy');
        strict_1.default.equal(summary.topFailures[0].module, 'trust-governance');
    });
    (0, node_test_1.default)('FoundationAlertDrilldownResponse 结构', () => {
        const drilldown = {
            generatedAt: '2026-01-01T00:00:00.000Z',
            code: 'approvals-pending',
            catalog: {
                code: 'approvals-pending',
                defaultSummary: '存在待处理审批单',
                severityPolicy: '>= 5 → high',
                sourceModules: ['trust-governance', 'configuration-governance'],
                drilldownEnabled: true,
                acknowledgementEnabled: true,
                drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
                ackPath: '/foundation/overview/alerts/approvals-pending/ack',
                mutePath: '/foundation/overview/alerts/approvals-pending/mute',
                unmutePath: '/foundation/overview/alerts/approvals-pending/unmute',
                acknowledgementStatus: null,
                visibleInOverview: true,
                latestHistoryAction: 'ACK',
                availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
            },
            alert: {
                severity: 'high',
                code: 'approvals-pending',
                count: 5,
                summary: '存在待处理审批单',
                acknowledgement: null
            },
            acknowledgement: null,
            history: [],
            detail: { pendingApprovals: 5 },
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
        };
        strict_1.default.equal(drilldown.code, 'approvals-pending');
        strict_1.default.equal(drilldown.alert?.severity, 'high');
        strict_1.default.equal(drilldown.alert?.count, 5);
    });
    (0, node_test_1.default)('AlertAcknowledgeBody / AlertMuteBody / AlertUnmuteBody 结构', () => {
        const ack = { note: '确认处理' };
        const mute = { mutedUntil: '2026-01-02T00:00:00.000Z', note: '临时静默' };
        const unmute = { note: '取消静默' };
        strict_1.default.equal(ack.note, '确认处理');
        strict_1.default.equal(mute.mutedUntil, '2026-01-02T00:00:00.000Z');
        strict_1.default.equal(unmute.note, '取消静默');
    });
});
//# sourceMappingURL=foundation.entity.test.js.map