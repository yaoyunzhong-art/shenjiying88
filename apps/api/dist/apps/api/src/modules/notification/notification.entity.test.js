"use strict";
/**
 * 🐜 自动: [notification] [D] entity 测试补全
 * 覆盖: NotificationChannelType / NotificationStatus / FoundationScopeType 枚举
 *       toNotificationTemplate / toNotificationDispatch factory
 *       NotificationTemplate / NotificationDispatch 接口
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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const notification_entity_1 = require("./notification.entity");
// ── 枚举测试 ──
(0, node_test_1.describe)('NotificationChannelType 枚举', () => {
    (0, node_test_1.default)('包含 EMAIL / SMS / PUSH / IN_APP / WEBHOOK / SOCIAL', () => {
        strict_1.default.equal(notification_entity_1.NotificationChannelType.Email, 'EMAIL');
        strict_1.default.equal(notification_entity_1.NotificationChannelType.Sms, 'SMS');
        strict_1.default.equal(notification_entity_1.NotificationChannelType.Push, 'PUSH');
        strict_1.default.equal(notification_entity_1.NotificationChannelType.InApp, 'IN_APP');
        strict_1.default.equal(notification_entity_1.NotificationChannelType.Webhook, 'WEBHOOK');
        strict_1.default.equal(notification_entity_1.NotificationChannelType.Social, 'SOCIAL');
    });
    (0, node_test_1.default)('共 6 个渠道类型', () => {
        strict_1.default.equal(Object.values(notification_entity_1.NotificationChannelType).length, 6);
    });
    (0, node_test_1.default)('枚举值均为不同字符串', () => {
        const values = Object.values(notification_entity_1.NotificationChannelType);
        const unique = new Set(values);
        strict_1.default.equal(unique.size, values.length);
    });
});
(0, node_test_1.describe)('NotificationStatus 枚举', () => {
    (0, node_test_1.default)('包含 PENDING / SENT / FAILED / CANCELLED', () => {
        strict_1.default.equal(notification_entity_1.NotificationStatus.Pending, 'PENDING');
        strict_1.default.equal(notification_entity_1.NotificationStatus.Sent, 'SENT');
        strict_1.default.equal(notification_entity_1.NotificationStatus.Failed, 'FAILED');
        strict_1.default.equal(notification_entity_1.NotificationStatus.Cancelled, 'CANCELLED');
    });
    (0, node_test_1.default)('共 4 个状态值', () => {
        strict_1.default.equal(Object.values(notification_entity_1.NotificationStatus).length, 4);
    });
});
(0, node_test_1.describe)('FoundationScopeType 枚举', () => {
    (0, node_test_1.default)('包含 TENANT / BRAND / STORE', () => {
        strict_1.default.equal(notification_entity_1.FoundationScopeType.Tenant, 'TENANT');
        strict_1.default.equal(notification_entity_1.FoundationScopeType.Brand, 'BRAND');
        strict_1.default.equal(notification_entity_1.FoundationScopeType.Store, 'STORE');
    });
    (0, node_test_1.default)('共 3 个 scope 类型', () => {
        strict_1.default.equal(Object.values(notification_entity_1.FoundationScopeType).length, 3);
    });
});
// ── Factory 测试 ──
(0, node_test_1.describe)('toNotificationTemplate()', () => {
    const baseInput = {
        code: 'welcome_email',
        channel: notification_entity_1.NotificationChannelType.Email,
        scopeType: notification_entity_1.FoundationScopeType.Tenant,
        locale: 'zh-CN',
        bodyTemplate: '欢迎 {{username}} 加入!'
    };
    (0, node_test_1.default)('生成 NotificationTemplate 含必填字段', () => {
        const result = (0, notification_entity_1.toNotificationTemplate)(baseInput);
        strict_1.default.ok(result.id.startsWith('welcome_email-'));
        strict_1.default.equal(result.code, 'welcome_email');
        strict_1.default.equal(result.channel, 'EMAIL');
        strict_1.default.equal(result.scopeType, 'TENANT');
        strict_1.default.equal(result.locale, 'zh-CN');
        strict_1.default.equal(result.bodyTemplate, '欢迎 {{username}} 加入!');
    });
    (0, node_test_1.default)('默认 enabled = true', () => {
        const result = (0, notification_entity_1.toNotificationTemplate)(baseInput);
        strict_1.default.equal(result.enabled, true);
    });
    (0, node_test_1.default)('默认 variables = []', () => {
        const result = (0, notification_entity_1.toNotificationTemplate)(baseInput);
        strict_1.default.deepStrictEqual(result.variables, []);
    });
    (0, node_test_1.default)('可使用自定义 variables', () => {
        const result = (0, notification_entity_1.toNotificationTemplate)({ ...baseInput, variables: ['username', 'store_name'] });
        strict_1.default.deepStrictEqual(result.variables, ['username', 'store_name']);
    });
    (0, node_test_1.default)('可设置 enabled = false', () => {
        const result = (0, notification_entity_1.toNotificationTemplate)({ ...baseInput, enabled: false });
        strict_1.default.equal(result.enabled, false);
    });
    (0, node_test_1.default)('含 createdAt 和 updatedAt ISO 时间戳', () => {
        const result = (0, notification_entity_1.toNotificationTemplate)(baseInput);
        strict_1.default.ok(new Date(result.createdAt).getTime() > 0);
        strict_1.default.ok(new Date(result.updatedAt).getTime() > 0);
        strict_1.default.equal(result.createdAt, result.updatedAt);
    });
    (0, node_test_1.default)('tenantId / brandId / storeId / marketCode 默认 undefined', () => {
        const result = (0, notification_entity_1.toNotificationTemplate)(baseInput);
        strict_1.default.equal(result.tenantId, undefined);
        strict_1.default.equal(result.brandId, undefined);
        strict_1.default.equal(result.storeId, undefined);
        strict_1.default.equal(result.marketCode, undefined);
        strict_1.default.equal(result.titleTemplate, undefined);
    });
    (0, node_test_1.default)('可设置 tenantId / marketCode / titleTemplate', () => {
        const result = (0, notification_entity_1.toNotificationTemplate)({
            ...baseInput,
            tenantId: 't-1',
            marketCode: 'cn-mainland',
            titleTemplate: '🎉 欢迎 {{username}}'
        });
        strict_1.default.equal(result.tenantId, 't-1');
        strict_1.default.equal(result.marketCode, 'cn-mainland');
        strict_1.default.equal(result.titleTemplate, '🎉 欢迎 {{username}}');
    });
    (0, node_test_1.default)('每次调用生成不同 id', () => {
        const a = (0, notification_entity_1.toNotificationTemplate)(baseInput);
        const b = (0, notification_entity_1.toNotificationTemplate)(baseInput);
        strict_1.default.notEqual(a.id, b.id);
    });
});
(0, node_test_1.describe)('toNotificationDispatch()', () => {
    const baseInput = {
        channel: notification_entity_1.NotificationChannelType.Sms,
        scopeType: notification_entity_1.FoundationScopeType.Store,
        recipient: '+8613800000001',
        payload: { code: '123456' }
    };
    (0, node_test_1.default)('生成 NotificationDispatch 含必填字段', () => {
        const result = (0, notification_entity_1.toNotificationDispatch)(baseInput);
        strict_1.default.ok(result.id.startsWith('dispatch-'));
        strict_1.default.equal(result.channel, 'SMS');
        strict_1.default.equal(result.scopeType, 'STORE');
        strict_1.default.equal(result.recipient, '+8613800000001');
        strict_1.default.deepStrictEqual(result.payload, { code: '123456' });
    });
    (0, node_test_1.default)('默认状态为 PENDING', () => {
        const result = (0, notification_entity_1.toNotificationDispatch)(baseInput);
        strict_1.default.equal(result.status, 'PENDING');
    });
    (0, node_test_1.default)('默认 retryCount = 0', () => {
        const result = (0, notification_entity_1.toNotificationDispatch)(baseInput);
        strict_1.default.equal(result.retryCount, 0);
    });
    (0, node_test_1.default)('sentAt 默认 undefined', () => {
        const result = (0, notification_entity_1.toNotificationDispatch)(baseInput);
        strict_1.default.equal(result.sentAt, undefined);
    });
    (0, node_test_1.default)('可设置 scheduledAt', () => {
        const future = new Date(Date.now() + 3600000).toISOString();
        const result = (0, notification_entity_1.toNotificationDispatch)({ ...baseInput, scheduledAt: future });
        strict_1.default.equal(result.scheduledAt, future);
    });
    (0, node_test_1.default)('可关联 templateId', () => {
        const result = (0, notification_entity_1.toNotificationDispatch)({ ...baseInput, templateId: 'tpl-001' });
        strict_1.default.equal(result.templateId, 'tpl-001');
    });
    (0, node_test_1.default)('可设置 tenantId / brandId / storeId', () => {
        const result = (0, notification_entity_1.toNotificationDispatch)({
            ...baseInput,
            tenantId: 't-1',
            brandId: 'b-1',
            storeId: 's-1'
        });
        strict_1.default.equal(result.tenantId, 't-1');
        strict_1.default.equal(result.brandId, 'b-1');
        strict_1.default.equal(result.storeId, 's-1');
    });
    (0, node_test_1.default)('每次调用生成不同 id', () => {
        const a = (0, notification_entity_1.toNotificationDispatch)(baseInput);
        const b = (0, notification_entity_1.toNotificationDispatch)(baseInput);
        strict_1.default.notEqual(a.id, b.id);
    });
});
//# sourceMappingURL=notification.entity.test.js.map