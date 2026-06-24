"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const analytics_controller_1 = require("./analytics.controller");
const analytics_module_1 = require("./analytics.module");
const analytics_service_1 = require("./analytics.service");
(0, node_test_1.default)('AnalyticsModule wires controller, provider, and LoyaltyModule', () => {
    const controllers = Reflect.getMetadata('controllers', analytics_module_1.AnalyticsModule);
    const providers = Reflect.getMetadata('providers', analytics_module_1.AnalyticsModule);
    const importsList = Reflect.getMetadata('imports', analytics_module_1.AnalyticsModule);
    const exportsList = Reflect.getMetadata('exports', analytics_module_1.AnalyticsModule);
    strict_1.default.ok(controllers?.includes(analytics_controller_1.AnalyticsController));
    strict_1.default.ok(providers?.includes(analytics_service_1.AnalyticsService));
    strict_1.default.ok(exportsList?.includes(analytics_service_1.AnalyticsService));
    const importNames = (importsList ?? []).map((entry) => entry.name);
    strict_1.default.ok(importNames.includes('LoyaltyModule'));
});
(0, node_test_1.default)('AnalyticsController is mounted at /analytics', () => {
    const path = Reflect.getMetadata('path', analytics_controller_1.AnalyticsController);
    strict_1.default.equal(path, 'analytics');
});
(0, node_test_1.default)('AnalyticsController exposes snapshot, diagnostics, recommendations routes', () => {
    const proto = analytics_controller_1.AnalyticsController.prototype;
    const routes = [];
    for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === 'constructor')
            continue;
        const member = proto[key];
        const method = Reflect.getMetadata('method', member);
        const path = Reflect.getMetadata('path', member);
        if (method !== undefined && path !== undefined) {
            routes.push({ method: String(method), path: String(path) });
        }
    }
    const hasRoute = (verb, pathValue) => routes.some((r) => r.method === String(verb) && r.path === pathValue);
    strict_1.default.ok(hasRoute(0, 'snapshot'));
    strict_1.default.ok(hasRoute(0, 'diagnostics'));
    strict_1.default.ok(hasRoute(0, 'recommendations'));
});
//# sourceMappingURL=analytics.module.test.js.map