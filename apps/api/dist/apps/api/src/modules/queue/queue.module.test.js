"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const queue_controller_1 = require("./queue.controller");
const queue_module_1 = require("./queue.module");
const queue_service_1 = require("./queue.service");
(0, node_test_1.default)('QueueModule exposes controller, provider, export wiring', () => {
    const controllers = Reflect.getMetadata('controllers', queue_module_1.QueueModule);
    const providers = Reflect.getMetadata('providers', queue_module_1.QueueModule);
    const exportsList = Reflect.getMetadata('exports', queue_module_1.QueueModule);
    strict_1.default.ok(controllers?.includes(queue_controller_1.QueueController));
    strict_1.default.ok(providers?.includes(queue_service_1.QueueService));
    strict_1.default.ok(exportsList?.includes(queue_service_1.QueueService));
});
//# sourceMappingURL=queue.module.test.js.map