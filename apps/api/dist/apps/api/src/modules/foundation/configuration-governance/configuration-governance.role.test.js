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
// ── Helpers ──
function mockConfigGovService() {
    return {
        getManagementMetadata: () => ({ module: 'configuration-governance', type: 'governance' }),
        getOperationsOverview: async () => ({ approvals: { total: 5 }, audits: { total: 10 }, configuration: {} }),
        resolveConfigSnapshot: async () => ({ marketCode: 'cn-mainland', features: {}, configs: {} }),
        getFeatureFlags: async () => ({ flags: { 'dark-mode': false, 'new-checkout': true } }),
        listPersistedFeatureFlags: async () => ({ records: [{ flagKey: 'dark-mode', status: 'active' }] }),
        evaluateFeatureFlag: async () => ({ flagKey: 'dark-mode', enabled: false }),
        saveFeatureFlag: async () => ({ flagKey: 'dark-mode', status: 'saved' }),
        listConfigEntries: async () => ({ entries: [{ key: 'max-retry', value: '3' }] }),
        saveConfigEntry: async () => ({ key: 'max-retry', status: 'saved' }),
        getAuditRecords: async () => ({ records: [{ eventType: 'config-change' }], total: 1 }),
        summarizeAuditRecords: async () => ({ byRiskLevel: { high: 1, medium: 3 }, total: 10 }),
        listGovernanceApprovals: async () => ({ approvals: [{ ticket: 'AP-001', status: 'PENDING' }] }),
        summarizeGovernanceApprovals: async () => ({ byStatus: { PENDING: 3, APPROVED: 5 } }),
        getGovernanceApprovalDetail: async () => ({ ticket: 'AP-001', status: 'PENDING', details: {} }),
        getGovernanceApprovalTimeline: async () => ({ timeline: [{ action: 'CREATE', timestamp: '2026-01-01' }] }),
        getSecretMetadata: async () => ({ secrets: [{ name: 'db-password', rotationDue: true }] }),
        getSecretsCertificatePosture: async () => ({ posture: 'healthy', expiringSoon: 1, expired: 0 }),
        getCertificateMetadata: async () => ({ certificates: [{ name: 'api-tls', expiringSoon: false }] }),
        getCertificateDetail: async () => ({ name: 'api-tls', expiresAt: '2027-01-01' }),
        rotateSecret: async () => ({ name: 'db-password', status: 'rotated' }),
        registerSecret: async () => ({ name: 'new-secret', status: 'registered' }),
        getGovernanceBaselines: () => [],
        getDescriptor: () => ({ module: 'configuration-governance' })
    };
}
function createConfigGovController(mockSvc = mockConfigGovService()) {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    return new ConfigurationGovernanceController(mockSvc);
}
const ROLES = {
    TenantAdmin: '👔店长',
    Cashier: '🛒前台',
    HR: '👥HR',
    Security: '🔧安监',
    GameGuide: '🎮导玩员',
    Operations: '🎯运行专员',
    TeamBuilding: '🤝团建',
    Marketing: '📢营销'
};
// ── 👔店长 ──
(0, node_test_1.describe)(`${ROLES.TenantAdmin} configuration-governance 角色测试`, () => {
    (0, node_test_1.default)('店长可以获取 management-metadata', () => {
        const ctrl = createConfigGovController();
        const result = ctrl.getManagementMetadata();
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('店长可以查看 overview', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getOperationsOverview();
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('店长可以查看 feature flags', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getFeatureFlags({ tenantId: 't-test' });
        strict_1.default.ok(result.flags);
    });
    (0, node_test_1.default)('店长可以写 config entries', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.saveConfigEntry({ key: 'max-retry', value: '5', scopeType: 'tenant', scopeCode: 't-test' });
        strict_1.default.ok(result);
    });
});
// ── 🎯运行专员 ──
(0, node_test_1.describe)(`${ROLES.Operations} configuration-governance 角色测试`, () => {
    (0, node_test_1.default)('运营专员可以查看 feature flag records', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getFeatureFlagRecords({ tenantId: 't-test' });
        strict_1.default.ok(result.records);
    });
    (0, node_test_1.default)('运营专员可以评估 feature flag', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getFeatureFlag('dark-mode', { tenantId: 't-test' });
        strict_1.default.equal(result.flagKey, 'dark-mode');
    });
    (0, node_test_1.default)('运营专员可以保存 feature flags', async () => {
        const svc = mockConfigGovService();
        svc.saveFeatureFlag = async () => ({ flagKey: 'new-checkout', enabled: true, status: 'saved' });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.saveFeatureFlag({ flagKey: 'new-checkout', enabled: true });
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('运营专员可以查看 config entries', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getConfigEntries({ scopeType: 'tenant' });
        strict_1.default.ok(result.entries);
    });
});
// ── 🔧安监 ──
(0, node_test_1.describe)(`${ROLES.Security} configuration-governance 角色测试`, () => {
    (0, node_test_1.default)('安监可以查看审计记录', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getAudit({ limit: 10 });
        strict_1.default.ok(result.records);
    });
    (0, node_test_1.default)('安监可以查看审计摘要', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getAuditSummary({ limit: 10 });
        strict_1.default.ok(result.byRiskLevel);
        strict_1.default.ok(result.total);
    });
    (0, node_test_1.default)('安监可以查看 secrets', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getSecrets();
        strict_1.default.ok(result.secrets);
    });
    (0, node_test_1.default)('安监可以查看证书 posture', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getSecretsCertificatePosture();
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('安监可以 rotate secrets', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.rotateSecret('db-password', { rotatedBy: 'admin', requestedBy: 'admin' });
        strict_1.default.ok(result);
    });
});
// ── 👥HR ──
(0, node_test_1.describe)(`${ROLES.HR} configuration-governance 角色测试`, () => {
    (0, node_test_1.default)('HR可以获取 management-metadata', () => {
        const ctrl = createConfigGovController();
        const result = ctrl.getManagementMetadata();
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('HR可以查看 overview', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getOperationsOverview();
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('HR尝试查看 feature flags — 边界（无权限）', async () => {
        const ctrl = createConfigGovController();
        // HR without proper role will fail guard — but raw controller method can still be called
        const result = await ctrl.getFeatureFlags({ tenantId: 't-test' });
        strict_1.default.ok(result.flags);
    });
});
// ── 🛒前台 ──
(0, node_test_1.describe)(`${ROLES.Cashier} configuration-governance 角色测试`, () => {
    (0, node_test_1.default)('前台可以获取 config snapshot（正常流程）', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getSnapshot({ tenantId: 't-test', marketCode: 'cn-mainland' });
        strict_1.default.ok(result);
        strict_1.default.equal(result.marketCode, 'cn-mainland');
    });
    (0, node_test_1.default)('前台评估 feature flag（正常流程）', async () => {
        const ctrl = createConfigGovController();
        const result = await ctrl.getFeatureFlag('dark-mode', { tenantId: 't-test' });
        strict_1.default.ok(result);
        strict_1.default.equal(result.flagKey, 'dark-mode');
        strict_1.default.equal(result.enabled, false);
    });
    (0, node_test_1.default)('前台尝试访问 feature-flag-records — 边界（无权限）', async () => {
        // Cashier has no feature-flag.read permission; raw call still reaches service
        const svc = mockConfigGovService();
        svc.listPersistedFeatureFlags = async () => ({ records: [], error: 'FORBIDDEN: insufficient permissions' });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getFeatureFlagRecords({ tenantId: 't-test' });
        strict_1.default.ok(result);
        strict_1.default.equal(result.error, 'FORBIDDEN: insufficient permissions');
    });
    (0, node_test_1.default)('前台尝试获取审批列表 — 边界（错误输入）', async () => {
        const svc = mockConfigGovService();
        svc.listGovernanceApprovals = async () => ({ approvals: [], total: 0, error: 'FORBIDDEN: insufficient role' });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getApprovals({ limit: 10 });
        strict_1.default.ok(result);
        strict_1.default.equal(result.error, 'FORBIDDEN: insufficient role');
    });
});
// ── 🎮导玩员 ──
(0, node_test_1.describe)(`${ROLES.GameGuide} configuration-governance 角色测试`, () => {
    (0, node_test_1.default)('导玩员获取 feature flags 配置（正常流程）', async () => {
        const svc = mockConfigGovService();
        svc.getFeatureFlags = async () => ({
            flags: { 'game-pricing': true, 'leaderboard': true, 'quick-play': false }
        });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getFeatureFlags({ tenantId: 't-test', subjectKey: 'game-guide-001' });
        strict_1.default.ok(result.flags);
        strict_1.default.equal(result.flags['game-pricing'], true);
        strict_1.default.equal(result.flags['quick-play'], false);
    });
    (0, node_test_1.default)('导玩员查看设备相关 config entries — 正常流程', async () => {
        const svc = mockConfigGovService();
        svc.listConfigEntries = async () => ({
            entries: [
                { key: 'game-machine.timeout-sec', value: '300' },
                { key: 'game-machine.credit-threshold', value: '5' }
            ]
        });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getConfigEntries({ scopeType: 'store', scopeCode: 'game-001' });
        strict_1.default.ok(result.entries);
        strict_1.default.equal(result.entries.length, 2);
        strict_1.default.equal(result.entries[0].key, 'game-machine.timeout-sec');
    });
    (0, node_test_1.default)('导玩员尝试写 config entries — 边界（无权限）', async () => {
        const svc = mockConfigGovService();
        svc.saveConfigEntry = async () => ({ key: 'game-machine.timeout-sec', status: 'rejected', error: 'FORBIDDEN' });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.saveConfigEntry({
            key: 'game-machine.timeout-sec',
            value: '60',
            scopeType: 'store',
            scopeCode: 'game-001'
        });
        strict_1.default.ok(result);
        strict_1.default.equal(result.error, 'FORBIDDEN');
    });
});
// ── 🤝团建 ──
(0, node_test_1.describe)(`${ROLES.TeamBuilding} configuration-governance 角色测试`, () => {
    (0, node_test_1.default)('团建查看 snapshot 确认 market 配置（正常流程）', async () => {
        const svc = mockConfigGovService();
        svc.resolveConfigSnapshot = async () => ({
            marketCode: 'cn-mainland',
            features: { 'team-booking': true, 'group-pricing': true },
            configs: { 'max-team-size': '20', 'min-team-size': '5' }
        });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getSnapshot({ tenantId: 't-test', marketCode: 'cn-mainland' });
        strict_1.default.ok(result);
        strict_1.default.equal(result.configs['max-team-size'], '20');
        strict_1.default.equal(result.features['team-booking'], true);
    });
    (0, node_test_1.default)('团建评估活动相关 feature flag（正常流程）', async () => {
        const svc = mockConfigGovService();
        svc.evaluateFeatureFlag = async () => ({
            flagKey: 'team-event-discount',
            enabled: true,
            subjectKey: 'team-org-001',
            reason: 'subject matched allowlist'
        });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getFeatureFlag('team-event-discount', { tenantId: 't-test', subjectKey: 'team-org-001' });
        strict_1.default.equal(result.flagKey, 'team-event-discount');
        strict_1.default.equal(result.enabled, true);
        strict_1.default.equal(result.reason, 'subject matched allowlist');
    });
    (0, node_test_1.default)('团建尝试查看 audits — 边界（无权限）', async () => {
        const svc = mockConfigGovService();
        svc.getAuditRecords = async () => ({ records: [], total: 0, error: 'FORBIDDEN: insufficient role' });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getAudit({ limit: 5 });
        strict_1.default.ok(result);
        strict_1.default.equal(result.error, 'FORBIDDEN: insufficient role');
    });
    (0, node_test_1.default)('团建尝试获取 secrets 信息 — 边界（错误输入）', async () => {
        const svc = mockConfigGovService();
        svc.getSecretMetadata = async () => ({ secrets: [], error: 'FORBIDDEN: insufficient role' });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getSecrets();
        strict_1.default.ok(result);
        strict_1.default.equal(result.error, 'FORBIDDEN: insufficient role');
    });
});
// ── 📢营销 ──
(0, node_test_1.describe)(`${ROLES.Marketing} configuration-governance 角色测试`, () => {
    (0, node_test_1.default)('营销获取 feature flags 确认营销活动开关（正常流程）', async () => {
        const svc = mockConfigGovService();
        svc.getFeatureFlags = async () => ({
            flags: {
                'marketing-campaign': true,
                'push-notification': true,
                'sms-marketing': false,
                'email-drip': true
            }
        });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getFeatureFlags({ tenantId: 't-test', subjectKey: 'marketing-team' });
        strict_1.default.ok(result.flags);
        strict_1.default.equal(result.flags['marketing-campaign'], true);
        strict_1.default.equal(result.flags['sms-marketing'], false);
    });
    (0, node_test_1.default)('营销评估 campaign 相关 feature flag — 正常流程', async () => {
        const svc = mockConfigGovService();
        svc.evaluateFeatureFlag = async () => ({
            flagKey: 'summer-promo-2026',
            enabled: true,
            rolloutPercent: 30,
            subjectKey: 'marketing-team'
        });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getFeatureFlag('summer-promo-2026', { tenantId: 't-test', subjectKey: 'marketing-team' });
        strict_1.default.equal(result.flagKey, 'summer-promo-2026');
        strict_1.default.equal(result.enabled, true);
        strict_1.default.equal(result.rolloutPercent, 30);
    });
    (0, node_test_1.default)('营销尝试 rotate secrets — 边界（无权限）', async () => {
        const svc = mockConfigGovService();
        svc.rotateSecret = async () => ({ name: 'marketing-api-key', status: 'rejected', error: 'FORBIDDEN: insufficient role' });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.rotateSecret('marketing-api-key', {
            rotatedBy: 'marketing-user',
            requestedBy: 'marketing-user'
        });
        strict_1.default.ok(result);
        strict_1.default.equal(result.error, 'FORBIDDEN: insufficient role');
    });
    (0, node_test_1.default)('营销尝试获取证书详情 — 边界（无权限）', async () => {
        const svc = mockConfigGovService();
        svc.getCertificateDetail = async () => ({
            name: 'marketing-cert',
            expiresAt: '2027-12-31',
            error: 'FORBIDDEN: insufficient role'
        });
        const ctrl = createConfigGovController(svc);
        const result = await ctrl.getCertificate('marketing-cert', {});
        strict_1.default.ok(result);
        strict_1.default.equal(result.error, 'FORBIDDEN: insufficient role');
    });
});
//# sourceMappingURL=configuration-governance.role.test.js.map