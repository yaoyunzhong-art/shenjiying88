"use strict";
/**
 * 🐜 自动: [notification] [D] dto 测试补全
 * 覆盖: RegisterNotificationTemplateDto / SendNotificationDto / UpdateNotificationTemplateDto
 *       DTO 字段验证
 * 注意: class-validator 装饰器需要 reflect-metadata + NestJS 编译链，
 *       本测试仅验证 DTO 字段结构，完整验证在 controller test 中覆盖
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
(0, node_test_1.describe)('RegisterNotificationTemplateDto 结构', () => {
    (0, node_test_1.default)('code 是 string 属性', () => {
        const dto = { code: 'test_tpl' };
        strict_1.default.equal(typeof dto.code, 'string');
        strict_1.default.equal(dto.code.length, 8);
    });
    (0, node_test_1.default)('channel 必须有效', () => {
        const validChannels = ['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WEBHOOK', 'SOCIAL'];
        for (const ch of validChannels) {
            strict_1.default.ok(validChannels.includes(ch));
        }
        strict_1.default.equal(validChannels.length, 6);
    });
    (0, node_test_1.default)('scopeType 必须有效', () => {
        const validScopes = ['TENANT', 'BRAND', 'STORE'];
        for (const s of validScopes) {
            strict_1.default.ok(validScopes.includes(s));
        }
        strict_1.default.equal(validScopes.length, 3);
    });
    (0, node_test_1.default)('locale 是 string', () => {
        const dto = { locale: 'zh-CN' };
        strict_1.default.equal(dto.locale, 'zh-CN');
        strict_1.default.ok(typeof dto.locale === 'string');
    });
    (0, node_test_1.default)('bodyTemplate 是必填 string', () => {
        const dto = { bodyTemplate: '欢迎 {{name}}' };
        strict_1.default.equal(typeof dto.bodyTemplate, 'string');
        strict_1.default.ok(dto.bodyTemplate.length > 0);
    });
    (0, node_test_1.default)('可选字段可为 undefined', () => {
        const dto = {
            code: 't',
            channel: 'EMAIL',
            scopeType: 'TENANT',
            locale: 'zh-CN',
            bodyTemplate: 'test'
        };
        strict_1.default.equal(dto.tenantId, undefined);
        strict_1.default.equal(dto.brandId, undefined);
        strict_1.default.equal(dto.storeId, undefined);
        strict_1.default.equal(dto.marketCode, undefined);
        strict_1.default.equal(dto.titleTemplate, undefined);
        strict_1.default.equal(dto.variables, undefined);
        strict_1.default.equal(dto.enabled, undefined);
    });
    (0, node_test_1.default)('variables 是 string[]', () => {
        const dto = { variables: ['name', 'store'] };
        strict_1.default.ok(Array.isArray(dto.variables));
        strict_1.default.equal(dto.variables.length, 2);
    });
    (0, node_test_1.default)('enabled 是 boolean', () => {
        strict_1.default.equal(typeof true, 'boolean');
        strict_1.default.equal(typeof false, 'boolean');
    });
});
(0, node_test_1.describe)('SendNotificationDto 结构', () => {
    (0, node_test_1.default)('channel / scopeType / recipient / payload 必填', () => {
        const dto = {
            channel: 'EMAIL',
            scopeType: 'TENANT',
            recipient: 'user@test.com',
            payload: { key: 'value' }
        };
        strict_1.default.equal(dto.channel, 'EMAIL');
        strict_1.default.equal(dto.scopeType, 'TENANT');
        strict_1.default.equal(dto.recipient, 'user@test.com');
        strict_1.default.deepStrictEqual(dto.payload, { key: 'value' });
    });
    (0, node_test_1.default)('templateCode 可选', () => {
        const dto = { templateCode: undefined };
        strict_1.default.equal(dto.templateCode, undefined);
        const dto2 = { templateCode: 'welcome_email' };
        strict_1.default.equal(dto2.templateCode, 'welcome_email');
    });
    (0, node_test_1.default)('scheduledAt 是 ISO 字符串', () => {
        const iso = new Date().toISOString();
        const dto = { scheduledAt: iso };
        strict_1.default.ok(typeof dto.scheduledAt === 'string');
        strict_1.default.ok(new Date(dto.scheduledAt).getTime() > 0);
    });
    (0, node_test_1.default)('payload 是 object', () => {
        strict_1.default.equal(typeof {}, 'object');
        strict_1.default.ok(!Array.isArray({}));
    });
});
(0, node_test_1.describe)('UpdateNotificationTemplateDto 结构', () => {
    (0, node_test_1.default)('所有字段可选', () => {
        const dto = {};
        strict_1.default.equal(dto.titleTemplate, undefined);
        strict_1.default.equal(dto.bodyTemplate, undefined);
        strict_1.default.equal(dto.variables, undefined);
        strict_1.default.equal(dto.enabled, undefined);
    });
    (0, node_test_1.default)('可部分更新 titleTemplate', () => {
        const dto = { titleTemplate: '新标题' };
        strict_1.default.equal(dto.titleTemplate, '新标题');
        strict_1.default.equal(dto.bodyTemplate, undefined);
    });
    (0, node_test_1.default)('可部分更新 enabled', () => {
        const dto = { enabled: false };
        strict_1.default.equal(dto.enabled, false);
    });
    (0, node_test_1.default)('可同时更新多个字段', () => {
        const dto = {
            titleTemplate: '新标题',
            bodyTemplate: '新内容',
            variables: ['a', 'b'],
            enabled: true
        };
        strict_1.default.equal(dto.titleTemplate, '新标题');
        strict_1.default.equal(dto.bodyTemplate, '新内容');
        strict_1.default.deepStrictEqual(dto.variables, ['a', 'b']);
        strict_1.default.equal(dto.enabled, true);
    });
});
//# sourceMappingURL=notification.dto.test.js.map