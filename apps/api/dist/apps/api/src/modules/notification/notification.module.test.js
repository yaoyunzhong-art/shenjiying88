"use strict";
/**
 * 🐜 自动: [notification] [D] module 测试补全
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const notification_controller_1 = require("./notification.controller");
const notification_module_1 = require("./notification.module");
const notification_service_1 = require("./notification.service");
(0, node_test_1.default)('NotificationModule wires controller, provider, and export', () => {
    const controllers = Reflect.getMetadata('controllers', notification_module_1.NotificationModule);
    const providers = Reflect.getMetadata('providers', notification_module_1.NotificationModule);
    const exportsList = Reflect.getMetadata('exports', notification_module_1.NotificationModule);
    strict_1.default.ok(controllers?.includes(notification_controller_1.NotificationController));
    strict_1.default.ok(providers?.includes(notification_service_1.NotificationService));
    strict_1.default.ok(exportsList?.includes(notification_service_1.NotificationService));
});
(0, node_test_1.default)('NotificationModule 无外部依赖导入', () => {
    const importsList = Reflect.getMetadata('imports', notification_module_1.NotificationModule);
    // NotificationModule is self-contained, no cross-module imports
    strict_1.default.ok(!importsList || importsList.length === 0);
});
(0, node_test_1.default)('NotificationController is mounted at /notifications', () => {
    const path = Reflect.getMetadata('path', notification_controller_1.NotificationController);
    strict_1.default.equal(path, 'notifications');
});
(0, node_test_1.default)('NotificationController exposes template + dispatch routes', () => {
    const proto = notification_controller_1.NotificationController.prototype;
    const routes = [];
    for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === 'constructor')
            continue;
        const member = proto[key];
        const method = Reflect.getMetadata('method', member);
        const path = Reflect.getMetadata('path', member);
        if (method !== undefined && path !== undefined) {
            routes.push({ method: String(method), path: String(path), handler: key });
        }
    }
    const hasRoute = (verb, pathValue) => routes.some((r) => r.method === String(verb) && r.path === pathValue);
    // NestJS RequestMethod enum: GET=0, POST=1, PUT=2, DELETE=3, PATCH=4
    strict_1.default.ok(hasRoute(1, 'templates'), 'POST /notifications/templates');
    strict_1.default.ok(hasRoute(0, 'templates'), 'GET /notifications/templates');
    strict_1.default.ok(hasRoute(0, 'templates/:id'), 'GET /notifications/templates/:id');
    strict_1.default.ok(hasRoute(4, 'templates/:id'), 'PATCH /notifications/templates/:id'); // PATCH=4 in NestJS
    strict_1.default.ok(hasRoute(1, 'send'), 'POST /notifications/send');
    strict_1.default.ok(hasRoute(0, 'dispatches'), 'GET /notifications/dispatches');
    strict_1.default.ok(hasRoute(0, 'dispatches/:id'), 'GET /notifications/dispatches/:id');
    strict_1.default.ok(hasRoute(1, 'dispatches/:id/retry'), 'POST /notifications/dispatches/:id/retry');
    strict_1.default.ok(hasRoute(1, 'dispatches/:id/cancel'), 'POST /notifications/dispatches/:id/cancel');
});
//# sourceMappingURL=notification.module.test.js.map