"use strict";
/**
 * 🐜 自动: [notification] [D] controller 测试补全
 * 覆盖: metadata 路由定义 + route handler 运行行为 + 正例 + 反例 + 边界
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
const notification_entity_1 = require("./notification.entity");
const sampleCtx = {
    tenantId: 't-1',
    brandId: 'b-1',
    storeId: 's-1',
    marketCode: 'cn-mainland'
};
// ── Metadata 测试 ──
(0, node_test_1.describe)('NotificationController 路由 metadata', () => {
    (0, node_test_1.default)('controller path = "notifications"', () => {
        const path = Reflect.getMetadata('path', notification_controller_1.NotificationController);
        strict_1.default.equal(path, 'notifications');
    });
    (0, node_test_1.default)('POST templates 路由', () => {
        const method = Reflect.getMetadata('method', notification_controller_1.NotificationController.prototype.registerTemplate);
        const path = Reflect.getMetadata('path', notification_controller_1.NotificationController.prototype.registerTemplate);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'templates');
    });
    (0, node_test_1.default)('GET templates 路由', () => {
        const method = Reflect.getMetadata('method', notification_controller_1.NotificationController.prototype.listTemplates);
        const path = Reflect.getMetadata('path', notification_controller_1.NotificationController.prototype.listTemplates);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'templates');
    });
    (0, node_test_1.default)('GET templates/:id 路由', () => {
        const method = Reflect.getMetadata('method', notification_controller_1.NotificationController.prototype.getTemplate);
        const path = Reflect.getMetadata('path', notification_controller_1.NotificationController.prototype.getTemplate);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'templates/:id');
    });
    (0, node_test_1.default)('PATCH templates/:id 路由', () => {
        const method = Reflect.getMetadata('method', notification_controller_1.NotificationController.prototype.updateTemplate);
        const path = Reflect.getMetadata('path', notification_controller_1.NotificationController.prototype.updateTemplate);
        strict_1.default.equal(method, 4); // PATCH = 4 in NestJS RequestMethod
        strict_1.default.equal(path, 'templates/:id');
    });
    (0, node_test_1.default)('POST send 路由', () => {
        const method = Reflect.getMetadata('method', notification_controller_1.NotificationController.prototype.send);
        const path = Reflect.getMetadata('path', notification_controller_1.NotificationController.prototype.send);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'send');
    });
    (0, node_test_1.default)('GET dispatches 路由', () => {
        const method = Reflect.getMetadata('method', notification_controller_1.NotificationController.prototype.listDispatches);
        const path = Reflect.getMetadata('path', notification_controller_1.NotificationController.prototype.listDispatches);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'dispatches');
    });
    (0, node_test_1.default)('GET dispatches/:id 路由', () => {
        const method = Reflect.getMetadata('method', notification_controller_1.NotificationController.prototype.getDispatch);
        const path = Reflect.getMetadata('path', notification_controller_1.NotificationController.prototype.getDispatch);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'dispatches/:id');
    });
    (0, node_test_1.default)('POST dispatches/:id/retry 路由', () => {
        const method = Reflect.getMetadata('method', notification_controller_1.NotificationController.prototype.retryDispatch);
        const path = Reflect.getMetadata('path', notification_controller_1.NotificationController.prototype.retryDispatch);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'dispatches/:id/retry');
    });
    (0, node_test_1.default)('POST dispatches/:id/cancel 路由', () => {
        const method = Reflect.getMetadata('method', notification_controller_1.NotificationController.prototype.cancelDispatch);
        const path = Reflect.getMetadata('path', notification_controller_1.NotificationController.prototype.cancelDispatch);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'dispatches/:id/cancel');
    });
});
// ── 行为测试 - Template ──
(0, node_test_1.describe)('NotificationController - registerTemplate()', () => {
    (0, node_test_1.default)('注册模板返回 contract', () => {
        const mockService = {
            registerTemplate: () => (0, notification_entity_1.toNotificationTemplate)({
                code: 'welcome',
                channel: notification_entity_1.NotificationChannelType.Email,
                scopeType: notification_entity_1.FoundationScopeType.Tenant,
                tenantId: 't-1',
                locale: 'zh-CN',
                bodyTemplate: '欢迎 {{name}}'
            })
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.registerTemplate(sampleCtx, {
            code: 'welcome',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            bodyTemplate: '欢迎 {{name}}'
        });
        strict_1.default.equal(result.code, 'welcome');
        strict_1.default.equal(result.channel, 'EMAIL');
        strict_1.default.equal(result.enabled, true);
    });
    (0, node_test_1.default)('service 抛出异常向上传播', () => {
        const mockService = {
            registerTemplate: () => { throw new Error('code already exists'); }
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        strict_1.default.throws(() => ctrl.registerTemplate(sampleCtx, { code: 'duplicate' }), /code already exists/);
    });
});
(0, node_test_1.describe)('NotificationController - listTemplates()', () => {
    (0, node_test_1.default)('返回模板列表 contract', () => {
        const mockService = {
            listTemplates: () => [
                (0, notification_entity_1.toNotificationTemplate)({
                    code: 't1',
                    channel: notification_entity_1.NotificationChannelType.Email,
                    scopeType: notification_entity_1.FoundationScopeType.Tenant,
                    locale: 'zh-CN',
                    bodyTemplate: 'body1'
                }),
                (0, notification_entity_1.toNotificationTemplate)({
                    code: 't2',
                    channel: notification_entity_1.NotificationChannelType.Sms,
                    scopeType: notification_entity_1.FoundationScopeType.Store,
                    locale: 'zh-CN',
                    bodyTemplate: 'body2'
                })
            ]
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.listTemplates(sampleCtx);
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(result[0].code, 't1');
        strict_1.default.equal(result[1].code, 't2');
    });
    (0, node_test_1.default)('空列表返回 []', () => {
        const mockService = { listTemplates: () => [] };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.listTemplates(sampleCtx);
        strict_1.default.deepStrictEqual(result, []);
    });
    (0, node_test_1.default)('传递 query 参数', () => {
        const calls = [];
        const mockService = {
            listTemplates: (filters) => {
                calls.push(filters);
                return [];
            }
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        ctrl.listTemplates(sampleCtx, notification_entity_1.NotificationChannelType.Email, notification_entity_1.FoundationScopeType.Tenant, 'true');
        strict_1.default.equal(calls.length, 1);
        strict_1.default.equal(calls[0].channel, 'EMAIL');
        strict_1.default.equal(calls[0].scopeType, 'TENANT');
        strict_1.default.equal(calls[0].enabled, true);
    });
    (0, node_test_1.default)('enabled 参数 false', () => {
        const calls = [];
        const mockService = {
            listTemplates: (filters) => { calls.push(filters); return []; }
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        ctrl.listTemplates(sampleCtx, undefined, undefined, 'false');
        strict_1.default.equal(calls[0].enabled, false);
    });
});
(0, node_test_1.describe)('NotificationController - getTemplate()', () => {
    (0, node_test_1.default)('返回存在的模板', () => {
        const tpl = (0, notification_entity_1.toNotificationTemplate)({
            code: 'exists',
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            bodyTemplate: 'exists body'
        });
        const mockService = { getTemplate: () => tpl };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.getTemplate(tpl.id);
        strict_1.default.ok(result);
        strict_1.default.equal(result.code, 'exists');
    });
    (0, node_test_1.default)('返回 null 对不存在的模板', () => {
        const mockService = { getTemplate: () => undefined };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        strict_1.default.equal(ctrl.getTemplate('nope'), null);
    });
});
(0, node_test_1.describe)('NotificationController - updateTemplate()', () => {
    (0, node_test_1.default)('更新模板返回 contract', () => {
        const tpl = (0, notification_entity_1.toNotificationTemplate)({
            code: 'to_update',
            channel: notification_entity_1.NotificationChannelType.InApp,
            scopeType: notification_entity_1.FoundationScopeType.Brand,
            locale: 'zh-CN',
            bodyTemplate: 'original'
        });
        const mockService = {
            updateTemplate: () => ({ ...tpl, titleTemplate: 'NEW', enabled: false, updatedAt: new Date().toISOString() })
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.updateTemplate(tpl.id, { titleTemplate: 'NEW', enabled: false });
        strict_1.default.ok(result);
        strict_1.default.equal(result.titleTemplate, 'NEW');
        strict_1.default.equal(result.enabled, false);
    });
    (0, node_test_1.default)('不存在的模板返回 null', () => {
        const mockService = { updateTemplate: () => undefined };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        strict_1.default.equal(ctrl.updateTemplate('nope', { enabled: false }), null);
    });
});
// ── 行为测试 - Dispatch ──
(0, node_test_1.describe)('NotificationController - send()', () => {
    (0, node_test_1.default)('发送通知返回 dispatch contract', () => {
        const dispatch = (0, notification_entity_1.toNotificationDispatch)({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            tenantId: 't-1',
            recipient: '+8613800000001',
            payload: { code: '123456' }
        });
        const mockService = {
            send: () => ({ ...dispatch, status: notification_entity_1.NotificationStatus.Sent, sentAt: new Date().toISOString() })
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.send(sampleCtx, {
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: '+8613800000001',
            payload: { code: '123456' }
        });
        strict_1.default.equal(result.channel, 'SMS');
        strict_1.default.equal(result.recipient, '+8613800000001');
        strict_1.default.equal(result.status, 'SENT');
    });
    (0, node_test_1.default)('发送失败时返回 FAILED 状态', () => {
        const dispatch = (0, notification_entity_1.toNotificationDispatch)({
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'fail@test.com',
            payload: {}
        });
        const mockService = {
            send: () => ({
                ...dispatch,
                status: notification_entity_1.NotificationStatus.Failed,
                providerResponse: { error: 'PROVIDER_REJECTED' }
            })
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.send(sampleCtx, {
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'fail@test.com',
            payload: {}
        });
        strict_1.default.equal(result.status, 'FAILED');
        strict_1.default.ok(result.providerResponse);
    });
    (0, node_test_1.default)('service 抛出异常向上传播', () => {
        const mockService = { send: () => { throw new Error('Rate limit exceeded'); } };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        strict_1.default.throws(() => ctrl.send(sampleCtx, {}), /Rate limit exceeded/);
    });
});
(0, node_test_1.describe)('NotificationController - listDispatches()', () => {
    (0, node_test_1.default)('返回 dispatch 列表', () => {
        const d1 = (0, notification_entity_1.toNotificationDispatch)({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'a',
            payload: {}
        });
        const d2 = (0, notification_entity_1.toNotificationDispatch)({
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'b',
            payload: {}
        });
        const mockService = {
            listDispatches: () => [
                { ...d1, status: notification_entity_1.NotificationStatus.Sent },
                { ...d2, status: notification_entity_1.NotificationStatus.Failed }
            ]
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.listDispatches(sampleCtx);
        strict_1.default.equal(result.length, 2);
    });
    (0, node_test_1.default)('传递过滤参数', () => {
        const calls = [];
        const mockService = {
            listDispatches: (filters) => { calls.push(filters); return []; }
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        ctrl.listDispatches(sampleCtx, notification_entity_1.NotificationStatus.Failed, notification_entity_1.NotificationChannelType.Email, 'test@user.com');
        strict_1.default.equal(calls[0].status, 'FAILED');
        strict_1.default.equal(calls[0].channel, 'EMAIL');
        strict_1.default.equal(calls[0].recipient, 'test@user.com');
        strict_1.default.equal(calls[0].tenantId, 't-1');
    });
});
(0, node_test_1.describe)('NotificationController - getDispatch()', () => {
    (0, node_test_1.default)('返回存在的 dispatch', () => {
        const d = (0, notification_entity_1.toNotificationDispatch)({
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'user-x',
            payload: {}
        });
        const mockService = { getDispatch: () => ({ ...d, status: notification_entity_1.NotificationStatus.Sent }) };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.getDispatch(d.id);
        strict_1.default.ok(result);
        strict_1.default.equal(result.id, d.id);
    });
    (0, node_test_1.default)('返回 null 对不存在 dispatch', () => {
        const mockService = { getDispatch: () => undefined };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        strict_1.default.equal(ctrl.getDispatch('nope'), null);
    });
});
(0, node_test_1.describe)('NotificationController - retryDispatch()', () => {
    (0, node_test_1.default)('重试失败 dispatch', () => {
        const d = (0, notification_entity_1.toNotificationDispatch)({
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'fail@test.com',
            payload: {}
        });
        const mockService = {
            retryDispatch: () => ({
                ...d,
                status: notification_entity_1.NotificationStatus.Sent,
                retryCount: 1,
                sentAt: new Date().toISOString()
            })
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.retryDispatch(d.id);
        strict_1.default.ok(result);
        strict_1.default.equal(result.status, 'SENT');
        strict_1.default.equal(result.retryCount, 1);
    });
    (0, node_test_1.default)('不存在 dispatch 返回 null', () => {
        const mockService = { retryDispatch: () => undefined };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        strict_1.default.equal(ctrl.retryDispatch('nope'), null);
    });
});
(0, node_test_1.describe)('NotificationController - cancelDispatch()', () => {
    (0, node_test_1.default)('取消 dispatch', () => {
        const d = (0, notification_entity_1.toNotificationDispatch)({
            channel: notification_entity_1.NotificationChannelType.Webhook,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            recipient: 'cancel-me@test.com',
            payload: {}
        });
        const mockService = {
            cancelDispatch: () => ({
                ...d,
                status: notification_entity_1.NotificationStatus.Cancelled,
                updatedAt: new Date().toISOString()
            })
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        const result = ctrl.cancelDispatch(d.id);
        strict_1.default.ok(result);
        strict_1.default.equal(result.status, 'CANCELLED');
    });
    (0, node_test_1.default)('不存在 dispatch 返回 null', () => {
        const mockService = { cancelDispatch: () => undefined };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        strict_1.default.equal(ctrl.cancelDispatch('nope'), null);
    });
});
// ── 边界条件 ──
(0, node_test_1.describe)('NotificationController - 边界条件', () => {
    (0, node_test_1.default)('tenantContext 正确传递给模板注册', () => {
        const calls = [];
        const mockService = {
            registerTemplate: (input) => {
                calls.push(input);
                return (0, notification_entity_1.toNotificationTemplate)(input);
            }
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        ctrl.registerTemplate(sampleCtx, {
            code: 'boundary',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            locale: 'zh-CN',
            bodyTemplate: 'test'
        });
        strict_1.default.equal(calls[0].tenantId, 't-1');
        strict_1.default.equal(calls[0].brandId, 'b-1');
        strict_1.default.equal(calls[0].storeId, 's-1');
    });
    (0, node_test_1.default)('body 中的 tenantId 覆盖 tenantContext', () => {
        const calls = [];
        const mockService = {
            registerTemplate: (input) => {
                calls.push(input);
                return (0, notification_entity_1.toNotificationTemplate)(input);
            }
        };
        const ctrl = new notification_controller_1.NotificationController(mockService);
        ctrl.registerTemplate(sampleCtx, {
            code: 'override',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            tenantId: 't-override',
            locale: 'zh-CN',
            bodyTemplate: 'test'
        });
        strict_1.default.equal(calls[0].tenantId, 't-override');
    });
});
//# sourceMappingURL=notification.controller.test.js.map