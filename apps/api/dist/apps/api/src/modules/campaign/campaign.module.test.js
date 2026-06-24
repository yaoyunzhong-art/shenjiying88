"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const campaign_controller_1 = require("./campaign.controller");
const campaign_module_1 = require("./campaign.module");
const campaign_service_1 = require("./campaign.service");
(0, node_test_1.default)('CampaignModule wires controller, provider, and export', () => {
    const controllers = Reflect.getMetadata('controllers', campaign_module_1.CampaignModule);
    const providers = Reflect.getMetadata('providers', campaign_module_1.CampaignModule);
    const exportsList = Reflect.getMetadata('exports', campaign_module_1.CampaignModule);
    strict_1.default.ok(controllers?.includes(campaign_controller_1.CampaignController));
    strict_1.default.ok(providers?.includes(campaign_service_1.CampaignService));
    strict_1.default.ok(exportsList?.includes(campaign_service_1.CampaignService));
});
(0, node_test_1.default)('CampaignModule imports Member and Loyalty modules for plan-driven actions', () => {
    const importsList = Reflect.getMetadata('imports', campaign_module_1.CampaignModule);
    const importNames = (importsList ?? []).map((entry) => entry.name);
    strict_1.default.ok(importNames.includes('MemberModule'));
    strict_1.default.ok(importNames.includes('LoyaltyModule'));
});
(0, node_test_1.default)('CampaignController is mounted at /campaigns', () => {
    const path = Reflect.getMetadata('path', campaign_controller_1.CampaignController);
    strict_1.default.equal(path, 'campaigns');
});
(0, node_test_1.default)('CampaignController exposes register, list, get, update, dispatches, evaluate routes', () => {
    const proto = campaign_controller_1.CampaignController.prototype;
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
    // NestJS RequestMethod enum:
    //   GET = 0, POST = 1, PUT = 2, DELETE = 3, PATCH = 4
    strict_1.default.ok(hasRoute(1, '/'), 'POST /campaigns');
    strict_1.default.ok(hasRoute(0, '/'), 'GET /campaigns');
    strict_1.default.ok(hasRoute(0, ':planId'), 'GET /campaigns/:planId');
    strict_1.default.ok(hasRoute(4, ':planId/status'), 'PATCH /campaigns/:planId/status');
    strict_1.default.ok(hasRoute(0, ':planId/dispatches'), 'GET /campaigns/:planId/dispatches');
    strict_1.default.ok(hasRoute(0, 'dispatches/list'), 'GET /campaigns/dispatches/list');
    strict_1.default.ok(hasRoute(1, 'evaluate'), 'POST /campaigns/evaluate');
});
//# sourceMappingURL=campaign.module.test.js.map