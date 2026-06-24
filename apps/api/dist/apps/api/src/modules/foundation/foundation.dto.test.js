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
(0, node_test_1.describe)('foundation DTO 类型验证', () => {
    (0, node_test_1.default)('AlertAcknowledgeDto 可选 note 字段', () => {
        const withNote = { note: '确认' };
        const withoutNote = {};
        strict_1.default.equal(withNote.note, '确认');
        strict_1.default.equal(withoutNote.note, undefined);
    });
    (0, node_test_1.default)('AlertAcknowledgeDto 空体合法', () => {
        const body = {};
        strict_1.default.ok(typeof body === 'object');
    });
    (0, node_test_1.default)('AlertMuteDto 可选字段', () => {
        const full = { mutedUntil: '2026-01-02T00:00:00.000Z', note: '静默 1 天' };
        const partial = { mutedUntil: '2026-01-02T00:00:00.000Z' };
        const empty = {};
        strict_1.default.equal(full.mutedUntil, '2026-01-02T00:00:00.000Z');
        strict_1.default.equal(full.note, '静默 1 天');
        strict_1.default.equal(partial.mutedUntil, '2026-01-02T00:00:00.000Z');
        strict_1.default.equal(partial.note, undefined);
        strict_1.default.equal(empty.mutedUntil, undefined);
        strict_1.default.equal(empty.note, undefined);
    });
    (0, node_test_1.default)('AlertUnmuteDto 结构', () => {
        const withNote = { note: '重新打开' };
        const withoutNote = {};
        strict_1.default.equal(withNote.note, '重新打开');
        strict_1.default.equal(withoutNote.note, undefined);
    });
    (0, node_test_1.default)('UnsupportedAlertCodeResponseDto 结构', () => {
        const resp = {
            generatedAt: '2026-01-01T00:00:00.000Z',
            code: 'unknown-code',
            availableAlertCodes: [
                'approvals-pending',
                'approval-execution-failures',
                'high-risk-audits',
                'blocked-rate-limit-ledgers',
                'secret-rotation-attention',
                'observability-degradation',
                'recovery-drill-attention',
                'runtime-governance-backlog',
                'runtime-callback-stalled',
                'lyt-connection-governance-risk'
            ]
        };
        strict_1.default.equal(resp.code, 'unknown-code');
        strict_1.default.ok(Array.isArray(resp.availableAlertCodes));
        strict_1.default.ok(resp.availableAlertCodes.length >= 10);
    });
    (0, node_test_1.default)('ModuleDetailResponseDto 结构', () => {
        const detail = {
            generatedAt: '2026-01-01T00:00:00.000Z',
            moduleKey: 'trust-governance',
            health: {
                module: 'trust-governance',
                score: 85,
                status: 'healthy',
                indicators: { highRiskAudits: 0, pendingApprovals: 1, executionFailures: 0, blockedCount: 0 }
            },
            detail: { approvals: { statuses: { PENDING: 1 } } }
        };
        strict_1.default.equal(detail.moduleKey, 'trust-governance');
        strict_1.default.equal(detail.health.status, 'healthy');
        strict_1.default.equal(detail.health.score, 85);
    });
    (0, node_test_1.default)('ModuleDetailResponseDto 未知模块返回 availableModuleKeys', () => {
        const detail = {
            generatedAt: '2026-01-01T00:00:00.000Z',
            moduleKey: 'unknown-module',
            availableModuleKeys: ['trust-governance', 'configuration-governance', 'resilience-operations', 'runtime-governance']
        };
        strict_1.default.equal(detail.moduleKey, 'unknown-module');
        strict_1.default.ok(Array.isArray(detail.availableModuleKeys));
        strict_1.default.equal(detail.availableModuleKeys.length, 4);
    });
    (0, node_test_1.default)('ConsumerDependencyResponseDto 结构', () => {
        const found = {
            consumer: 'market',
            modulePath: 'src/modules/market',
            dependsOn: ['identity-access', 'configuration-governance'],
            responsibility: '输出多市场默认值'
        };
        const notFound = {
            availableConsumers: ['market', 'portal', 'workbench', 'lyt-adapter']
        };
        strict_1.default.equal(found.consumer, 'market');
        strict_1.default.ok(Array.isArray(found.dependsOn));
        strict_1.default.ok(Array.isArray(notFound.availableConsumers));
        strict_1.default.equal(notFound.availableConsumers.length, 4);
        strict_1.default.equal(notFound.consumer, undefined);
    });
});
//# sourceMappingURL=foundation.dto.test.js.map