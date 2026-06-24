"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const transactions_module_1 = require("./transactions.module");
const transactions_controller_1 = require("./transactions.controller");
const transactions_service_1 = require("./transactions.service");
(0, node_test_1.default)('TransactionsModule exposes controller, provider, export wiring', () => {
    const imports = Reflect.getMetadata('imports', transactions_module_1.TransactionsModule);
    const controllers = Reflect.getMetadata('controllers', transactions_module_1.TransactionsModule);
    const providers = Reflect.getMetadata('providers', transactions_module_1.TransactionsModule);
    const exportsList = Reflect.getMetadata('exports', transactions_module_1.TransactionsModule);
    strict_1.default.ok(Array.isArray(imports));
    strict_1.default.ok(controllers?.includes(transactions_controller_1.TransactionsController));
    strict_1.default.ok(providers?.includes(transactions_service_1.TransactionsService));
    strict_1.default.ok(exportsList?.includes(transactions_service_1.TransactionsService));
});
//# sourceMappingURL=transactions.module.test.js.map