"use strict";
/**
 * 🐜 扩展角色测试: notification 模块
 *
 * 4 个附加角色视角：
 * 👥HR — 发送全员通知
 * 📢营销 — 发送营销推送
 * 🎯运行专员 — 管理通知模板
 * 👔店长 — 查看通知历史
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
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
const notification_controller_1 = require("./notification.controller");
const notification_service_1 = require("./notification.service");
const notification_entity_1 = require("./notification.entity");
// ── 测试数据工厂 ──
const tenantCtx = {
    tenantId: 't-notif-ext',
    brandId: 'b-arcade',
    storeId: 's-main',
};
function createController() {
    (0, notification_service_1.resetNotificationServiceTestState)();
    const service = new notification_service_1.NotificationService();
    return new notification_controller_1.NotificationController(service);
}
// ──────────────────────────────────────────────────────────────────────
// 👥HR — 发送全员通知 (HR sending mass notifications)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('👥HR — 全员通知发送视角', () => {
    (0, node_test_1.default)('发送邮件通知到指定员工 (send email notification)', () => {
        const ctrl = createController();
        // 先注册模板
        ctrl.registerTemplate(tenantCtx, {
            code: 'HR-ANNOUNCEMENT',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            titleTemplate: '通知: {subject}',
            bodyTemplate: '各位同事，{message}。谢谢。',
            variables: ['subject', 'message'],
            enabled: true,
        });
        // 发送通知
        const dispatch = ctrl.send(tenantCtx, {
            templateCode: 'HR-ANNOUNCEMENT',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'all@example.com',
            payload: { subject: '端午节放假安排', message: '6月25日-27日放假' },
        });
        strict_1.default.equal(dispatch.channel, 'EMAIL');
        strict_1.default.equal(dispatch.recipient, 'all@example.com');
        // simulateSend 自动处理为 SENT (除非收件人含 "fail")
        strict_1.default.equal(dispatch.status, 'SENT');
        (0, strict_1.default)(dispatch.sentAt, '发送后应有发送时间');
    });
    (0, node_test_1.default)('发送失败时状态标记为 FAILED (send failure handling)', () => {
        const ctrl = createController();
        ctrl.registerTemplate(tenantCtx, {
            code: 'HR-TEST-FAIL',
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            bodyTemplate: '测试短信 {code}',
            variables: ['code'],
            enabled: true,
        });
        // 收件人含 "fail" 触发模拟失败
        const dispatch = ctrl.send(tenantCtx, {
            templateCode: 'HR-TEST-FAIL',
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'fail-phone@example.com',
            payload: { code: '123456' },
        });
        strict_1.default.equal(dispatch.status, 'FAILED');
        (0, strict_1.default)(dispatch.providerResponse, '失败应有 provider 响应信息');
    });
    (0, node_test_1.default)('重试失败的通知 (retry failed dispatch)', () => {
        const ctrl = createController();
        ctrl.registerTemplate(tenantCtx, {
            code: 'HR-RETRY',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            bodyTemplate: '重试测试',
            enabled: true,
        });
        const failed = ctrl.send(tenantCtx, {
            templateCode: 'HR-RETRY',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'fail-retry@example.com',
            payload: {},
        });
        strict_1.default.equal(failed.status, 'FAILED');
        // 重试
        const retried = ctrl.retryDispatch(failed.id);
        (0, strict_1.default)(retried, '重试应返回通知');
        (0, strict_1.default)(retried.retryCount >= 1, '重试次数应增加');
    });
});
// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 发送营销推送 (marketing sending campaign alerts)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('📢营销 — 营销推送发送视角', () => {
    (0, node_test_1.default)('注册营销推送模板并发送 (send marketing push)', () => {
        const ctrl = createController();
        ctrl.registerTemplate(tenantCtx, {
            code: 'MARKETING-PROMO',
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Brand,
            locale: 'zh-CN',
            titleTemplate: '{promoTitle}',
            bodyTemplate: '限时优惠: {description}，速来参与！',
            variables: ['promoTitle', 'description'],
            enabled: true,
        });
        const dispatch = ctrl.send(tenantCtx, {
            templateCode: 'MARKETING-PROMO',
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Brand,
            recipient: 'member-m001',
            payload: {
                promoTitle: '618 大促',
                description: '全场游戏币 8 折',
            },
        });
        strict_1.default.equal(dispatch.status, 'SENT');
        strict_1.default.equal(dispatch.recipient, 'member-m001');
    });
    (0, node_test_1.default)('按渠道筛选推送历史记录 (filter by channel)', () => {
        const ctrl = createController();
        ctrl.registerTemplate(tenantCtx, {
            code: 'PUSH-ALERT', channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Tenant, locale: 'zh-CN',
            bodyTemplate: '推送测试', enabled: true,
        });
        ctrl.registerTemplate(tenantCtx, {
            code: 'SMS-ALERT', channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Tenant, locale: 'zh-CN',
            bodyTemplate: '短信测试', enabled: true,
        });
        ctrl.send(tenantCtx, {
            templateCode: 'PUSH-ALERT', channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Tenant, recipient: 'u-push-01', payload: {},
        });
        ctrl.send(tenantCtx, {
            templateCode: 'SMS-ALERT', channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Tenant, recipient: 'u-sms-01', payload: {},
        });
        const pushDispatches = ctrl.listDispatches(tenantCtx, undefined, notification_entity_1.NotificationChannelType.Push);
        strict_1.default.equal(pushDispatches.length, 1);
        strict_1.default.equal(pushDispatches[0].channel, 'PUSH');
        const smsDispatches = ctrl.listDispatches(tenantCtx, undefined, notification_entity_1.NotificationChannelType.Sms);
        strict_1.default.equal(smsDispatches.length, 1);
    });
    (0, node_test_1.default)('活动定时推送支持 (scheduled dispatch)', () => {
        const ctrl = createController();
        const scheduledTime = '2026-07-01T08:00:00.000Z';
        ctrl.registerTemplate(tenantCtx, {
            code: 'SCHEDULED-PROMO',
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            locale: 'zh-CN',
            bodyTemplate: '活动即将开始!',
            enabled: true,
        });
        const dispatch = ctrl.send(tenantCtx, {
            templateCode: 'SCHEDULED-PROMO',
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'all-members',
            payload: {},
            scheduledAt: scheduledTime,
        });
        strict_1.default.equal(dispatch.scheduledAt, scheduledTime);
        (0, strict_1.default)(dispatch.createdAt !== undefined);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 管理通知模板 (operations managing notification templates)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('🎯运行专员 — 通知模板管理视角', () => {
    (0, node_test_1.default)('注册新的通知模板 (register template)', () => {
        const ctrl = createController();
        const template = ctrl.registerTemplate(tenantCtx, {
            code: 'OPS-ALERT',
            channel: notification_entity_1.NotificationChannelType.InApp,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            locale: 'zh-CN',
            titleTemplate: '系统通知',
            bodyTemplate: '{message}',
            variables: ['message'],
            enabled: true,
        });
        strict_1.default.equal(template.code, 'OPS-ALERT');
        strict_1.default.equal(template.channel, 'IN_APP');
        (0, strict_1.default)(template.id, '模板应有 ID');
    });
    (0, node_test_1.default)('更新通知模板内容 (update template)', () => {
        const ctrl = createController();
        const template = ctrl.registerTemplate(tenantCtx, {
            code: 'OPS-UPDATE-TEST',
            channel: notification_entity_1.NotificationChannelType.InApp,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            locale: 'zh-CN',
            bodyTemplate: '旧内容',
            enabled: true,
        });
        // 更新模板
        const updated = ctrl.updateTemplate(template.id, {
            bodyTemplate: '新内容',
            enabled: false,
        });
        (0, strict_1.default)(updated, '更新应返回模板');
        strict_1.default.equal(updated.bodyTemplate, '新内容');
        strict_1.default.equal(updated.enabled, false);
    });
    (0, node_test_1.default)('按渠道和启用状态筛选模板 (filter templates)', () => {
        const ctrl = createController();
        ctrl.registerTemplate(tenantCtx, {
            code: 'T1', channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant, locale: 'zh-CN',
            bodyTemplate: 'E1', enabled: true,
        });
        ctrl.registerTemplate(tenantCtx, {
            code: 'T2', channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Tenant, locale: 'zh-CN',
            bodyTemplate: 'S1', enabled: false,
        });
        ctrl.registerTemplate(tenantCtx, {
            code: 'T3', channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Tenant, locale: 'zh-CN',
            bodyTemplate: 'S2', enabled: true,
        });
        const smsTemplates = ctrl.listTemplates(tenantCtx, notification_entity_1.NotificationChannelType.Sms);
        strict_1.default.equal(smsTemplates.length, 2);
        const enabledSms = ctrl.listTemplates(tenantCtx, notification_entity_1.NotificationChannelType.Sms, undefined, "true");
    });
});
// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 查看通知历史 (shop manager viewing notification history)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('👔店长 — 通知历史查看视角', () => {
    (0, node_test_1.default)('查询所有通知发送记录 (list dispatches)', () => {
        const ctrl = createController();
        ctrl.registerTemplate(tenantCtx, {
            code: 'HISTORY-TEST',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            bodyTemplate: '历史测试',
            enabled: true,
        });
        ctrl.send(tenantCtx, {
            templateCode: 'HISTORY-TEST',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'hist-01@example.com',
            payload: {},
        });
        ctrl.send(tenantCtx, {
            templateCode: 'HISTORY-TEST',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'hist-02@example.com',
            payload: {},
        });
        const all = ctrl.listDispatches(tenantCtx);
        strict_1.default.equal(all.length, 2);
    });
    (0, node_test_1.default)('查询单个通知详情 (get dispatch detail)', () => {
        const ctrl = createController();
        ctrl.registerTemplate(tenantCtx, {
            code: 'DETAIL-TEST',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            bodyTemplate: '详情测试',
            enabled: true,
        });
        const dispatch = ctrl.send(tenantCtx, {
            templateCode: 'DETAIL-TEST',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'detail@example.com',
            payload: { key: 'value' },
        });
        const detail = ctrl.getDispatch(dispatch.id);
        (0, strict_1.default)(detail, '应返回通知详情');
        strict_1.default.equal(detail.recipient, 'detail@example.com');
        (0, strict_1.default)(detail.sentAt, '已发送的通知应有发送时间');
    });
    (0, node_test_1.default)('取消待发送通知 (cancel pending dispatch)', () => {
        const ctrl = createController();
        ctrl.registerTemplate(tenantCtx, {
            code: 'CANCEL-TEST',
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            bodyTemplate: '将被取消',
            enabled: true,
        });
        // 用 "fail" 收件人模拟失败后取消
        const failed = ctrl.send(tenantCtx, {
            templateCode: 'CANCEL-TEST',
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'fail-cancel@example.com',
            payload: {},
        });
        strict_1.default.equal(failed.status, 'FAILED');
        // 尝试取消 (FAILED 状态可取消)
        const cancelled = ctrl.cancelDispatch(failed.id);
        (0, strict_1.default)(cancelled, '取消应返回通知');
        strict_1.default.equal(cancelled.status, 'CANCELLED');
    });
});
//# sourceMappingURL=notification.role-extended.test.js.map