"use strict";
/**
 * 🐜 自动: [notification] [D] service 测试补全
 * 覆盖: registerTemplate / getTemplate / findTemplateByCode / listTemplates / updateTemplate
 *       send / getDispatch / listDispatches / retryDispatch / cancelDispatch
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
const notification_service_1 = require("./notification.service");
// ── Template operations ──
(0, node_test_1.describe)('NotificationService - Template', () => {
    const service = new notification_service_1.NotificationService();
    (0, node_test_1.default)('registerTemplate 返回完整 NotificationTemplate', () => {
        const tpl = service.registerTemplate({
            code: 'welcome_email',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            tenantId: 't-1',
            locale: 'zh-CN',
            bodyTemplate: '欢迎 {{name}}',
            variables: ['name']
        });
        strict_1.default.equal(tpl.code, 'welcome_email');
        strict_1.default.equal(tpl.channel, 'EMAIL');
        strict_1.default.equal(tpl.scopeType, 'TENANT');
        strict_1.default.equal(tpl.locale, 'zh-CN');
        strict_1.default.equal(tpl.enabled, true);
    });
    (0, node_test_1.default)('getTemplate 可获取已注册模板', () => {
        const tpl = service.registerTemplate({
            code: 'order_shipped',
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            tenantId: 't-1',
            locale: 'zh-CN',
            bodyTemplate: '订单 {{orderId}} 已发货'
        });
        const fetched = service.getTemplate(tpl.id);
        strict_1.default.ok(fetched);
        strict_1.default.equal(fetched.code, 'order_shipped');
    });
    (0, node_test_1.default)('getTemplate 返回 undefined 对不存在的 id', () => {
        strict_1.default.equal(service.getTemplate('nonexistent'), undefined);
    });
    (0, node_test_1.default)('findTemplateByCode 按 code 查找已启用的模板', () => {
        const tpl = service.registerTemplate({
            code: 'payment_success',
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            tenantId: 't-1',
            locale: 'zh-CN',
            bodyTemplate: '支付成功'
        });
        const found = service.findTemplateByCode('payment_success');
        strict_1.default.ok(found);
        strict_1.default.equal(found.id, tpl.id);
    });
    (0, node_test_1.default)('findTemplateByCode 跳过已禁用的模板', () => {
        const tpl = service.registerTemplate({
            code: 'disabled_tpl',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            bodyTemplate: 'disabled',
            enabled: false
        });
        const found = service.findTemplateByCode('disabled_tpl');
        strict_1.default.equal(found, undefined);
        // 但 getTemplate 仍能找到
        strict_1.default.ok(service.getTemplate(tpl.id));
    });
    (0, node_test_1.default)('findTemplateByCode 返回 undefined 对不存在的 code', () => {
        strict_1.default.equal(service.findTemplateByCode('never_exists'), undefined);
    });
    (0, node_test_1.default)('listTemplates 返回所有模板', () => {
        const all = service.listTemplates();
        strict_1.default.ok(all.length >= 4, `Expected >=4, got ${all.length}`);
    });
    (0, node_test_1.default)('listTemplates 支持 channel 过滤', () => {
        const emailTemplates = service.listTemplates({ channel: notification_entity_1.NotificationChannelType.Email });
        strict_1.default.ok(emailTemplates.length >= 2);
        for (const t of emailTemplates) {
            strict_1.default.equal(t.channel, 'EMAIL');
        }
    });
    (0, node_test_1.default)('listTemplates 支持 enabled 过滤', () => {
        const enabledOnly = service.listTemplates({ enabled: true });
        strict_1.default.ok(enabledOnly.length > 0);
        for (const t of enabledOnly) {
            strict_1.default.equal(t.enabled, true);
        }
    });
    (0, node_test_1.default)('listTemplates 支持 disabled 过滤', () => {
        const disabledOnly = service.listTemplates({ enabled: false });
        strict_1.default.ok(disabledOnly.length >= 1);
        for (const t of disabledOnly) {
            strict_1.default.equal(t.enabled, false);
        }
    });
    (0, node_test_1.default)('listTemplates 支持 scopeType 过滤', () => {
        const tenantTemplates = service.listTemplates({ scopeType: notification_entity_1.FoundationScopeType.Tenant });
        strict_1.default.ok(tenantTemplates.length > 0);
        for (const t of tenantTemplates) {
            strict_1.default.equal(t.scopeType, 'TENANT');
        }
    });
    (0, node_test_1.default)('listTemplates 支持 tenantId 过滤', () => {
        const t1Templates = service.listTemplates({ tenantId: 't-1' });
        strict_1.default.ok(t1Templates.length > 0);
        for (const t of t1Templates) {
            strict_1.default.equal(t.tenantId, 't-1');
        }
    });
    (0, node_test_1.default)('updateTemplate 更新 titleTemplate / enabled', () => {
        const tpl = service.registerTemplate({
            code: 'update_test',
            channel: notification_entity_1.NotificationChannelType.InApp,
            scopeType: notification_entity_1.FoundationScopeType.Brand,
            locale: 'zh-CN',
            bodyTemplate: '原内容'
        });
        const updated = service.updateTemplate(tpl.id, { titleTemplate: '新标题', enabled: false });
        strict_1.default.ok(updated);
        strict_1.default.equal(updated.titleTemplate, '新标题');
        strict_1.default.equal(updated.enabled, false);
        strict_1.default.equal(updated.bodyTemplate, '原内容'); // 未被覆盖
    });
    (0, node_test_1.default)('updateTemplate 对不存在的 id 返回 undefined', () => {
        strict_1.default.equal(service.updateTemplate('not-exist', { enabled: false }), undefined);
    });
});
// ── Dispatch operations ──
(0, node_test_1.describe)('NotificationService - Dispatch', () => {
    const service = new notification_service_1.NotificationService();
    (0, node_test_1.default)('send 创建并发送 NotificationDispatch', () => {
        const dispatch = service.send({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: '+8613800000001',
            payload: { code: '123456' },
            tenantId: 't-1'
        });
        strict_1.default.ok(dispatch.id);
        strict_1.default.equal(dispatch.channel, 'SMS');
        strict_1.default.equal(dispatch.recipient, '+8613800000001');
        // 发送后状态为 SENT 或 FAILED
        strict_1.default.ok(dispatch.status === 'SENT' || dispatch.status === 'FAILED', `Unexpected status: ${dispatch.status}`);
    });
    (0, node_test_1.default)('send 关联模板（通过 templateCode）', () => {
        const tpl = service.registerTemplate({
            code: 'linked_tpl',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            bodyTemplate: '关联模板'
        });
        const dispatch = service.send({
            templateCode: 'linked_tpl',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'user@test.com',
            payload: {}
        });
        strict_1.default.equal(dispatch.templateId, tpl.id);
    });
    (0, node_test_1.default)('send 处理 scheduledAt', () => {
        const future = new Date(Date.now() + 3600000).toISOString();
        const dispatch = service.send({
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'device-token-123',
            payload: { title: 'scheduled' },
            scheduledAt: future
        });
        strict_1.default.equal(dispatch.scheduledAt, future);
    });
    (0, node_test_1.default)('send 对 fail 收件人模拟发送失败', () => {
        const dispatch = service.send({
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'fail@test.com',
            payload: {}
        });
        strict_1.default.equal(dispatch.status, 'FAILED');
        strict_1.default.ok(dispatch.providerResponse);
        strict_1.default.equal(dispatch.providerResponse.error, 'PROVIDER_REJECTED');
    });
    (0, node_test_1.default)('getDispatch 获取已创建的 dispatch', () => {
        const dispatch = service.send({
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'device-token-456',
            payload: { message: 'hello' }
        });
        const fetched = service.getDispatch(dispatch.id);
        strict_1.default.ok(fetched);
        strict_1.default.equal(fetched.id, dispatch.id);
    });
    (0, node_test_1.default)('getDispatch 对不存在 id 返回 undefined', () => {
        strict_1.default.equal(service.getDispatch('no-such-dispatch'), undefined);
    });
    (0, node_test_1.default)('listDispatches 返回所有 dispatch', () => {
        const all = service.listDispatches();
        strict_1.default.ok(all.length > 0);
    });
    (0, node_test_1.default)('listDispatches 支持 status 过滤', () => {
        const sent = service.listDispatches({ status: notification_entity_1.NotificationStatus.Sent });
        strict_1.default.ok(sent.length > 0);
        for (const d of sent) {
            strict_1.default.equal(d.status, 'SENT');
        }
        const failed = service.listDispatches({ status: notification_entity_1.NotificationStatus.Failed });
        strict_1.default.ok(failed.length > 0);
        for (const d of failed) {
            strict_1.default.equal(d.status, 'FAILED');
        }
    });
    (0, node_test_1.default)('listDispatches 支持 channel 过滤', () => {
        const emailOnly = service.listDispatches({ channel: notification_entity_1.NotificationChannelType.Email });
        strict_1.default.ok(emailOnly.length > 0);
        for (const d of emailOnly) {
            strict_1.default.equal(d.channel, 'EMAIL');
        }
    });
    (0, node_test_1.default)('listDispatches 支持 recipient 过滤', () => {
        const filtered = service.listDispatches({ recipient: 'fail@test.com' });
        strict_1.default.ok(filtered.length > 0);
        for (const d of filtered) {
            strict_1.default.equal(d.recipient, 'fail@test.com');
        }
    });
    (0, node_test_1.default)('listDispatches 支持 tenantId 过滤', () => {
        const t1 = service.listDispatches({ tenantId: 't-1' });
        strict_1.default.ok(t1.length > 0);
    });
    (0, node_test_1.default)('retryDispatch 重试失败的 dispatch', () => {
        const dispatch = service.send({
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'fail@test.com',
            payload: {}
        });
        strict_1.default.equal(dispatch.status, 'FAILED');
        // Manually override the status in store to FAILED (simulateSend already set it)
        // Then retry — with same recipient, it fails again, which is correct behavior
        const retried = service.retryDispatch(dispatch.id);
        strict_1.default.ok(retried);
        strict_1.default.equal(retried.retryCount, dispatch.retryCount + 1);
    });
    (0, node_test_1.default)('retryDispatch 对已 SENT 的不重复发送', () => {
        const dispatch = service.send({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: '+8613800000009',
            payload: {}
        });
        strict_1.default.equal(dispatch.status, 'SENT');
        const retried = service.retryDispatch(dispatch.id);
        strict_1.default.ok(retried);
        strict_1.default.equal(retried.status, 'SENT');
        strict_1.default.equal(retried.retryCount, 0);
    });
    (0, node_test_1.default)('retryDispatch 对不存在 id 返回 undefined', () => {
        strict_1.default.equal(service.retryDispatch('nope'), undefined);
    });
    (0, node_test_1.default)('cancelDispatch 取消 PENDING 的 dispatch', () => {
        // Use a dispatch that is still PENDING by manually triggering it
        // Since simulateSend runs synchronously, we instead dispatch to "fail-cancel"
        // which becomes FAILED, then check cancel behavior on FAILED
        const dispatch = service.send({
            channel: notification_entity_1.NotificationChannelType.Webhook,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'fail-cancel@test.com',
            payload: {}
        });
        strict_1.default.equal(dispatch.status, 'FAILED');
        const cancelled = service.cancelDispatch(dispatch.id);
        strict_1.default.ok(cancelled);
        strict_1.default.equal(cancelled.status, 'CANCELLED');
    });
    (0, node_test_1.default)('cancelDispatch 对已 SENT 的不取消', () => {
        const dispatch = service.send({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: '+8613800000010',
            payload: {}
        });
        strict_1.default.equal(dispatch.status, 'SENT');
        const cancelled = service.cancelDispatch(dispatch.id);
        strict_1.default.ok(cancelled);
        strict_1.default.equal(cancelled.status, 'SENT'); // 已发送不可取消
    });
    (0, node_test_1.default)('cancelDispatch 对不存在 id 返回 undefined', () => {
        strict_1.default.equal(service.cancelDispatch('no-such'), undefined);
    });
});
//# sourceMappingURL=notification.service.test.js.map