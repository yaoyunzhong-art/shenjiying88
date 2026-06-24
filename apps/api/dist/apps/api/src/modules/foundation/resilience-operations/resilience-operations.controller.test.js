"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const resilience_operations_controller_1 = require("./resilience-operations.controller");
(0, node_test_1.default)('resilience operations controller exposes expected HTTP method decorators', () => {
    // Verify controller has route metadata via @Controller decorator
    const controllerPath = Reflect.getMetadata('path', resilience_operations_controller_1.ResilienceOperationsController);
    strict_1.default.equal(controllerPath, 'foundation/resilience-operations');
    // getManagementMetadata has @Get metadata
    const metadataPath = Reflect.getMetadata('path', resilience_operations_controller_1.ResilienceOperationsController.prototype.getManagementMetadata);
    const metadataMethod = Reflect.getMetadata('method', resilience_operations_controller_1.ResilienceOperationsController.prototype.getManagementMetadata);
    strict_1.default.equal(metadataPath, 'management-metadata');
    strict_1.default.equal(metadataMethod, 0); // GET
    // getOperationsOverview has @Get metadata
    const overviewPath = Reflect.getMetadata('path', resilience_operations_controller_1.ResilienceOperationsController.prototype.getOperationsOverview);
    const overviewMethod = Reflect.getMetadata('method', resilience_operations_controller_1.ResilienceOperationsController.prototype.getOperationsOverview);
    strict_1.default.equal(overviewPath, 'overview');
    strict_1.default.equal(overviewMethod, 0); // GET
    // getObservabilitySignals has @Get metadata
    const obsPath = Reflect.getMetadata('path', resilience_operations_controller_1.ResilienceOperationsController.prototype.getObservabilitySignals);
    const obsMethod = Reflect.getMetadata('method', resilience_operations_controller_1.ResilienceOperationsController.prototype.getObservabilitySignals);
    strict_1.default.equal(obsPath, 'observability');
    strict_1.default.equal(obsMethod, 0); // GET
    // getRetryPolicies has @Get metadata
    const retryPath = Reflect.getMetadata('path', resilience_operations_controller_1.ResilienceOperationsController.prototype.getRetryPolicies);
    const retryMethod = Reflect.getMetadata('method', resilience_operations_controller_1.ResilienceOperationsController.prototype.getRetryPolicies);
    strict_1.default.equal(retryPath, 'retry-policies');
    strict_1.default.equal(retryMethod, 0); // GET
    // getRecoveryPlans has @Get metadata
    const plansPath = Reflect.getMetadata('path', resilience_operations_controller_1.ResilienceOperationsController.prototype.getRecoveryPlans);
    const plansMethod = Reflect.getMetadata('method', resilience_operations_controller_1.ResilienceOperationsController.prototype.getRecoveryPlans);
    strict_1.default.equal(plansPath, 'recovery-plans');
    strict_1.default.equal(plansMethod, 0); // GET
    // getRecoveryPlan has @Get metadata with param
    const planPath = Reflect.getMetadata('path', resilience_operations_controller_1.ResilienceOperationsController.prototype.getRecoveryPlan);
    const planMethod = Reflect.getMetadata('method', resilience_operations_controller_1.ResilienceOperationsController.prototype.getRecoveryPlan);
    strict_1.default.equal(planPath, 'recovery-plans/:resource');
    strict_1.default.equal(planMethod, 0); // GET
    // stageEdgeReplay has @Post metadata
    const stagePath = Reflect.getMetadata('path', resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
    const stageMethod = Reflect.getMetadata('method', resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
    strict_1.default.equal(stagePath, 'edge-replay/stage');
    strict_1.default.equal(stageMethod, 1); // POST
});
//# sourceMappingURL=resilience-operations.controller.test.js.map