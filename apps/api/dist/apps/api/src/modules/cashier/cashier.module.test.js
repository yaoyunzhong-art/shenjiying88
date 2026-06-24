"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const cashier_module_1 = require("./cashier.module");
const cashier_controller_1 = require("./cashier.controller");
const cashier_service_1 = require("./cashier.service");
(0, node_test_1.default)('CashierModule exposes controller, provider, export wiring', () => {
    const metadata = Reflect.getMetadata('imports', cashier_module_1.CashierModule);
    const controllers = Reflect.getMetadata('controllers', cashier_module_1.CashierModule);
    const providers = Reflect.getMetadata('providers', cashier_module_1.CashierModule);
    const exportsList = Reflect.getMetadata('exports', cashier_module_1.CashierModule);
    strict_1.default.ok(Array.isArray(metadata));
    strict_1.default.ok(controllers?.includes(cashier_controller_1.CashierController));
    strict_1.default.ok(providers?.includes(cashier_service_1.CashierService));
    strict_1.default.ok(exportsList?.includes(cashier_service_1.CashierService));
});
//# sourceMappingURL=cashier.module.test.js.map