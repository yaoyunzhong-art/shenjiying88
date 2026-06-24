"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const integration_orchestration_controller_1 = require("./integration-orchestration.controller");
const identity_access_decorator_1 = require("../identity-access/identity-access.decorator");
(0, node_test_1.default)('integration orchestration controller exposes expected HTTP method decorators', () => {
    // Verify controller has route metadata via @Controller decorator
    const controllerPath = Reflect.getMetadata('path', integration_orchestration_controller_1.IntegrationOrchestrationController);
    strict_1.default.equal(controllerPath, 'foundation/integration-orchestration');
    // getWebhookSources has @Get metadata  
    const webhookSourcesPath = Reflect.getMetadata('path', integration_orchestration_controller_1.IntegrationOrchestrationController.prototype.getWebhookSources);
    const webhookSourcesMethod = Reflect.getMetadata('method', integration_orchestration_controller_1.IntegrationOrchestrationController.prototype.getWebhookSources);
    strict_1.default.equal(webhookSourcesPath, 'webhooks/sources');
    strict_1.default.equal(webhookSourcesMethod, 0); // GET
    // getEvents has @Get metadata
    const eventsPath = Reflect.getMetadata('path', integration_orchestration_controller_1.IntegrationOrchestrationController.prototype.getEvents);
    const eventsMethod = Reflect.getMetadata('method', integration_orchestration_controller_1.IntegrationOrchestrationController.prototype.getEvents);
    strict_1.default.equal(eventsPath, 'events');
    strict_1.default.equal(eventsMethod, 0); // GET
    // publishEvent has @Post metadata
    const publishPath = Reflect.getMetadata('path', integration_orchestration_controller_1.IntegrationOrchestrationController.prototype.publishEvent);
    const publishMethod = Reflect.getMetadata('method', integration_orchestration_controller_1.IntegrationOrchestrationController.prototype.publishEvent);
    strict_1.default.equal(publishPath, 'events');
    strict_1.default.equal(publishMethod, 1); // POST
    // ingestWebhook has @Post metadata with param
    const ingestPath = Reflect.getMetadata('path', integration_orchestration_controller_1.IntegrationOrchestrationController.prototype.ingestWebhook);
    const ingestMethod = Reflect.getMetadata('method', integration_orchestration_controller_1.IntegrationOrchestrationController.prototype.ingestWebhook);
    strict_1.default.equal(ingestPath, 'webhooks/:source/ingest');
    strict_1.default.equal(ingestMethod, 1); // POST
});
(0, node_test_1.default)('integration orchestration controller has no access control decorators (public webhook endpoints)', () => {
    const tenantScope = Reflect.getMetadata(identity_access_decorator_1.TENANT_SCOPE_METADATA_KEY, integration_orchestration_controller_1.IntegrationOrchestrationController);
    strict_1.default.equal(tenantScope, undefined);
    const publishPermissions = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, integration_orchestration_controller_1.IntegrationOrchestrationController.prototype.publishEvent);
    strict_1.default.equal(publishPermissions, undefined);
    const publishRoles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, integration_orchestration_controller_1.IntegrationOrchestrationController.prototype.publishEvent);
    strict_1.default.equal(publishRoles, undefined);
});
(0, node_test_1.default)('integration orchestration controller constructor accepts service dependency', () => {
    // Controller can be instantiated with a mock service (structural check)
    const controller = new integration_orchestration_controller_1.IntegrationOrchestrationController({});
    strict_1.default.ok(controller instanceof integration_orchestration_controller_1.IntegrationOrchestrationController);
    strict_1.default.equal(typeof controller.getWebhookSources, 'function');
    strict_1.default.equal(typeof controller.getEvents, 'function');
    strict_1.default.equal(typeof controller.publishEvent, 'function');
    strict_1.default.equal(typeof controller.ingestWebhook, 'function');
});
//# sourceMappingURL=integration-orchestration.controller.test.js.map