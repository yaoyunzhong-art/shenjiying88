"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const loyalty_controller_1 = require("./loyalty.controller");
const loyalty_module_1 = require("./loyalty.module");
const loyalty_service_1 = require("./loyalty.service");
(0, node_test_1.default)('LoyaltyModule exposes controller, provider, export wiring', () => {
    const controllers = Reflect.getMetadata('controllers', loyalty_module_1.LoyaltyModule);
    const providers = Reflect.getMetadata('providers', loyalty_module_1.LoyaltyModule);
    const exportsList = Reflect.getMetadata('exports', loyalty_module_1.LoyaltyModule);
    strict_1.default.ok(controllers?.includes(loyalty_controller_1.LoyaltyController));
    strict_1.default.ok(providers?.includes(loyalty_service_1.LoyaltyService));
    strict_1.default.ok(exportsList?.includes(loyalty_service_1.LoyaltyService));
});
//# sourceMappingURL=loyalty.module.test.js.map