"use strict";
/**
 * 🐜 自动: [notification] [D] contract 测试补全
 * 覆盖: toNotificationTemplateContract / toNotificationDispatchContract
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
const notification_contract_1 = require("./notification.contract");
const notification_entity_1 = require("./notification.entity");
(0, node_test_1.describe)('toNotificationTemplateContract()', () => {
    (0, node_test_1.default)('映射所有字段到 contract', () => {
        const entity = (0, notification_entity_1.toNotificationTemplate)({
            code: 'welcome_email',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            tenantId: 't-1',
            locale: 'zh-CN',
            bodyTemplate: '欢迎 {{name}}',
            variables: ['name'],
            titleTemplate: '🎉'
        });
        const contract = (0, notification_contract_1.toNotificationTemplateContract)(entity);
        strict_1.default.equal(contract.id, entity.id);
        strict_1.default.equal(contract.code, 'welcome_email');
        strict_1.default.equal(contract.channel, 'EMAIL');
        strict_1.default.equal(contract.scopeType, 'TENANT');
        strict_1.default.equal(contract.tenantId, 't-1');
        strict_1.default.equal(contract.locale, 'zh-CN');
        strict_1.default.equal(contract.bodyTemplate, '欢迎 {{name}}');
        strict_1.default.deepStrictEqual(contract.variables, ['name']);
        strict_1.default.equal(contract.titleTemplate, '🎉');
        strict_1.default.equal(contract.enabled, true);
    });
    (0, node_test_1.default)('enabled 字段传递正确', () => {
        const enabledEntity = (0, notification_entity_1.toNotificationTemplate)({
            code: 'enabled_test',
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            locale: 'en-US',
            bodyTemplate: 'Hello',
            enabled: true
        });
        strict_1.default.equal((0, notification_contract_1.toNotificationTemplateContract)(enabledEntity).enabled, true);
        const disabledEntity = (0, notification_entity_1.toNotificationTemplate)({
            code: 'disabled_test',
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            locale: 'en-US',
            bodyTemplate: 'Hello',
            enabled: false
        });
        strict_1.default.equal((0, notification_contract_1.toNotificationTemplateContract)(disabledEntity).enabled, false);
    });
});
(0, node_test_1.describe)('toNotificationDispatchContract()', () => {
    (0, node_test_1.default)('映射所有字段到 contract', () => {
        const entity = (0, notification_entity_1.toNotificationDispatch)({
            templateId: 'tpl-001',
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            tenantId: 't-1',
            brandId: 'b-1',
            storeId: 's-1',
            recipient: '+8613800000001',
            payload: { code: '123456' }
        });
        // Simulate post-send state
        const sentEntity = { ...entity, status: notification_entity_1.NotificationStatus.Sent, sentAt: new Date().toISOString() };
        const contract = (0, notification_contract_1.toNotificationDispatchContract)(sentEntity);
        strict_1.default.equal(contract.id, entity.id);
        strict_1.default.equal(contract.templateId, 'tpl-001');
        strict_1.default.equal(contract.channel, 'SMS');
        strict_1.default.equal(contract.scopeType, 'STORE');
        strict_1.default.equal(contract.recipient, '+8613800000001');
        strict_1.default.deepStrictEqual(contract.payload, { code: '123456' });
        strict_1.default.equal(contract.status, 'SENT');
        strict_1.default.equal(contract.retryCount, 0);
        strict_1.default.ok(contract.sentAt);
    });
    (0, node_test_1.default)('FAILED 状态含 providerResponse', () => {
        const entity = (0, notification_entity_1.toNotificationDispatch)({
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'fail@test.com',
            payload: {}
        });
        const failedEntity = {
            ...entity,
            status: notification_entity_1.NotificationStatus.Failed,
            providerResponse: { error: 'PROVIDER_REJECTED' }
        };
        const contract = (0, notification_contract_1.toNotificationDispatchContract)(failedEntity);
        strict_1.default.equal(contract.status, 'FAILED');
        strict_1.default.deepStrictEqual(contract.providerResponse, { error: 'PROVIDER_REJECTED' });
    });
    (0, node_test_1.default)('CANCELLED 状态正确传递', () => {
        const entity = (0, notification_entity_1.toNotificationDispatch)({
            channel: notification_entity_1.NotificationChannelType.InApp,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'user-123',
            payload: { message: 'test' }
        });
        const cancelledEntity = { ...entity, status: notification_entity_1.NotificationStatus.Cancelled };
        const contract = (0, notification_contract_1.toNotificationDispatchContract)(cancelledEntity);
        strict_1.default.equal(contract.status, 'CANCELLED');
    });
});
//# sourceMappingURL=notification.contract.test.js.map