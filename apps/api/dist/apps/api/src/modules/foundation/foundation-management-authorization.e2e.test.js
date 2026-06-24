"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const configuration_governance_dto_1 = require("./configuration-governance/configuration-governance.dto");
const identity_access_guard_1 = require("./identity-access/identity-access.guard");
const identity_access_decorator_1 = require("./identity-access/identity-access.decorator");
const identity_access_service_1 = require("./identity-access/identity-access.service");
const foundation_service_1 = require("./foundation.service");
const configuration_governance_service_1 = require("./configuration-governance/configuration-governance.service");
const runtime_governance_dto_1 = require("./runtime-governance/runtime-governance.dto");
const runtime_governance_service_1 = require("./runtime-governance/runtime-governance.service");
const trust_governance_dto_1 = require("./trust-governance/trust-governance.dto");
const trust_governance_service_1 = require("./trust-governance/trust-governance.service");
function attachRequestContext(req) {
    req.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-demo'
    };
    const actorId = req.header('x-actor-id');
    const rolesHeader = (req.header('x-roles') ?? '').split(',').map((item) => item.trim()).filter(Boolean);
    const permissionsHeader = (req.header('x-permissions') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    if (actorId) {
        req.actorContext = {
            actorId,
            actorType: 'tenant-user',
            tenantId: req.tenantContext.tenantId,
            roles: rolesHeader,
            permissions: permissionsHeader,
            authenticated: true,
            source: 'headers'
        };
    }
}
let TestAuthorizedConfigurationController = class TestAuthorizedConfigurationController {
    configurationGovernanceService;
    constructor(configurationGovernanceService) {
        this.configurationGovernanceService = configurationGovernanceService;
    }
    saveConfigEntry(body) {
        return this.configurationGovernanceService.saveConfigEntry(body);
    }
};
__decorate([
    (0, common_1.Post)('config-entries'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.config.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof configuration_governance_dto_1.UpsertConfigEntryDto !== "undefined" && configuration_governance_dto_1.UpsertConfigEntryDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], TestAuthorizedConfigurationController.prototype, "saveConfigEntry", null);
TestAuthorizedConfigurationController = __decorate([
    (0, common_1.Controller)('foundation/configuration-governance'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    __param(0, (0, common_1.Inject)(configuration_governance_service_1.ConfigurationGovernanceService)),
    __metadata("design:paramtypes", [typeof (_a = typeof configuration_governance_service_1.ConfigurationGovernanceService !== "undefined" && configuration_governance_service_1.ConfigurationGovernanceService) === "function" ? _a : Object])
], TestAuthorizedConfigurationController);
let TestAuthorizedTrustController = class TestAuthorizedTrustController {
    trustGovernanceService;
    constructor(trustGovernanceService) {
        this.trustGovernanceService = trustGovernanceService;
    }
    reset(body) {
        return this.trustGovernanceService.resetQuotaLedgers(body);
    }
};
__decorate([
    (0, common_1.Post)('rate-limit/ledgers/reset'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.quota-ledger.reset'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.ResetQuotaLedgerDto]),
    __metadata("design:returntype", void 0)
], TestAuthorizedTrustController.prototype, "reset", null);
TestAuthorizedTrustController = __decorate([
    (0, common_1.Controller)('foundation/trust-governance'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    __param(0, (0, common_1.Inject)(trust_governance_service_1.TrustGovernanceService)),
    __metadata("design:paramtypes", [trust_governance_service_1.TrustGovernanceService])
], TestAuthorizedTrustController);
let TestAuthorizedFoundationAlertsController = class TestAuthorizedFoundationAlertsController {
    foundationService;
    constructor(foundationService) {
        this.foundationService = foundationService;
    }
    acknowledge(code, body) {
        return this.foundationService.acknowledgeOperationsAlert(code, { tenantId: 'tenant-demo' }, {
            actorId: 'ops-admin',
            actorType: 'tenant-user',
            tenantId: 'tenant-demo',
            roles: ['OPERATIONS'],
            permissions: ['foundation.operations.alerts.write'],
            authenticated: true,
            source: 'headers'
        }, body.note);
    }
    mute(code, body) {
        return this.foundationService.muteOperationsAlert(code, { tenantId: 'tenant-demo' }, {
            actorId: 'ops-admin',
            actorType: 'tenant-user',
            tenantId: 'tenant-demo',
            roles: ['OPERATIONS'],
            permissions: ['foundation.operations.alerts.write'],
            authenticated: true,
            source: 'headers'
        }, body);
    }
    unmute(code, body) {
        return this.foundationService.unmuteOperationsAlert(code, { tenantId: 'tenant-demo' }, {
            actorId: 'ops-admin',
            actorType: 'tenant-user',
            tenantId: 'tenant-demo',
            roles: ['OPERATIONS'],
            permissions: ['foundation.operations.alerts.write'],
            authenticated: true,
            source: 'headers'
        }, body.note);
    }
};
__decorate([
    (0, common_1.Post)('overview/alerts/:code/ack'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.operations.alerts.write'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAuthorizedFoundationAlertsController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Post)('overview/alerts/:code/mute'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.operations.alerts.write'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAuthorizedFoundationAlertsController.prototype, "mute", null);
__decorate([
    (0, common_1.Post)('overview/alerts/:code/unmute'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.operations.alerts.write'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAuthorizedFoundationAlertsController.prototype, "unmute", null);
TestAuthorizedFoundationAlertsController = __decorate([
    (0, common_1.Controller)('foundation'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    __param(0, (0, common_1.Inject)(foundation_service_1.FoundationService)),
    __metadata("design:paramtypes", [foundation_service_1.FoundationService])
], TestAuthorizedFoundationAlertsController);
let TestFoundationOverviewController = class TestFoundationOverviewController {
    foundationService;
    constructor(foundationService) {
        this.foundationService = foundationService;
    }
    getOverview() {
        return this.foundationService.getOperationsOverview();
    }
    getAlerts() {
        return this.foundationService.getOperationsAlerts();
    }
    getAlertsCatalog() {
        return this.foundationService.getOperationsAlertsCatalog();
    }
    getAlertDrilldown(code) {
        return this.foundationService.getOperationsAlertDrilldown(code);
    }
    getModuleDetail(moduleKey) {
        return this.foundationService.getOperationsModuleDetail(moduleKey);
    }
};
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestFoundationOverviewController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('overview/alerts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestFoundationOverviewController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('overview/alerts/catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestFoundationOverviewController.prototype, "getAlertsCatalog", null);
__decorate([
    (0, common_1.Get)('overview/alerts/:code/drilldown'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestFoundationOverviewController.prototype, "getAlertDrilldown", null);
__decorate([
    (0, common_1.Get)('overview/modules/:moduleKey'),
    __param(0, (0, common_1.Param)('moduleKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestFoundationOverviewController.prototype, "getModuleDetail", null);
TestFoundationOverviewController = __decorate([
    (0, common_1.Controller)('foundation'),
    __param(0, (0, common_1.Inject)(foundation_service_1.FoundationService)),
    __metadata("design:paramtypes", [foundation_service_1.FoundationService])
], TestFoundationOverviewController);
let TestAuthorizedRuntimeGovernanceController = class TestAuthorizedRuntimeGovernanceController {
    runtimeGovernanceService;
    constructor(runtimeGovernanceService) {
        this.runtimeGovernanceService = runtimeGovernanceService;
    }
    submitAction(body, tenantContext, actorContext) {
        return this.runtimeGovernanceService.submitAction({
            ...body,
            actorId: actorContext?.actorId,
            tenantId: tenantContext?.tenantId,
            brandId: tenantContext?.brandId,
            storeId: tenantContext?.storeId,
            marketCode: tenantContext?.marketCode
        });
    }
    getActionReceipt(receiptCode) {
        return this.runtimeGovernanceService.getActionReceipt(receiptCode);
    }
    syncAction(receiptCode, body, tenantContext, actorContext) {
        return this.runtimeGovernanceService.syncAction(receiptCode, {
            ...body,
            actorId: actorContext?.actorId,
            tenantId: tenantContext?.tenantId
        });
    }
    recordCallback(receiptCode, body, tenantContext, actorContext) {
        return this.runtimeGovernanceService.recordCallback(receiptCode, {
            ...body,
            actorId: actorContext?.actorId,
            tenantId: tenantContext?.tenantId
        });
    }
    replayAction(receiptCode, body, tenantContext, actorContext) {
        return this.runtimeGovernanceService.replayAction(receiptCode, {
            ...body,
            actorId: actorContext?.actorId,
            tenantId: tenantContext?.tenantId
        });
    }
};
__decorate([
    (0, common_1.Post)('actions'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.runtime-governance.write'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [runtime_governance_dto_1.SubmitRuntimeGovernanceActionDto, Object, Object]),
    __metadata("design:returntype", void 0)
], TestAuthorizedRuntimeGovernanceController.prototype, "submitAction", null);
__decorate([
    (0, common_1.Get)('actions/:receiptCode'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.runtime-governance.read'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAuthorizedRuntimeGovernanceController.prototype, "getActionReceipt", null);
__decorate([
    (0, common_1.Post)('actions/:receiptCode/sync'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.runtime-governance.write'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __param(3, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, runtime_governance_dto_1.SyncRuntimeGovernanceActionDto, Object, Object]),
    __metadata("design:returntype", void 0)
], TestAuthorizedRuntimeGovernanceController.prototype, "syncAction", null);
__decorate([
    (0, common_1.Post)('actions/:receiptCode/callback'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.runtime-governance.write'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __param(3, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, runtime_governance_dto_1.RecordRuntimeGovernanceCallbackDto, Object, Object]),
    __metadata("design:returntype", void 0)
], TestAuthorizedRuntimeGovernanceController.prototype, "recordCallback", null);
__decorate([
    (0, common_1.Post)('actions/:receiptCode/replay'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.runtime-governance.write'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __param(3, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, runtime_governance_dto_1.ReplayRuntimeGovernanceActionDto, Object, Object]),
    __metadata("design:returntype", void 0)
], TestAuthorizedRuntimeGovernanceController.prototype, "replayAction", null);
TestAuthorizedRuntimeGovernanceController = __decorate([
    (0, common_1.Controller)('foundation/runtime-governance'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    __param(0, (0, common_1.Inject)(runtime_governance_service_1.RuntimeGovernanceService)),
    __metadata("design:paramtypes", [runtime_governance_service_1.RuntimeGovernanceService])
], TestAuthorizedRuntimeGovernanceController);
(0, node_test_1.default)('e2e: runtime governance endpoints enforce read/write permissions and tenant context', async () => {
    const runtimeCalls = [];
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAuthorizedRuntimeGovernanceController],
        providers: [
            core_1.Reflector,
            identity_access_service_1.IdentityAccessService,
            {
                provide: runtime_governance_service_1.RuntimeGovernanceService,
                useValue: {
                    submitAction: async (input) => {
                        runtimeCalls.push({ kind: 'submit', input });
                        return { status: 'submitted', input };
                    },
                    getActionReceipt: async (receiptCode) => {
                        runtimeCalls.push({ kind: 'query', receiptCode });
                        return { receiptCode, status: 'loaded' };
                    },
                    syncAction: async () => ({ status: 'synced' }),
                    recordCallback: async () => ({ status: 'callback-recorded' }),
                    replayAction: async () => ({ status: 'replay-scheduled' })
                }
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use((req, _res, next) => {
        attachRequestContext(req);
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalGuards(new identity_access_guard_1.IdentityAccessGuard(app.get(core_1.Reflector), app.get(identity_access_service_1.IdentityAccessService)));
    await app.init();
    try {
        const denied = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
            app: 'miniapp',
            action: 'booking-submit',
            nextStep: 'PROCEED',
            riskLevel: 'medium',
            requestEndpoint: '/api/v1/storefront/bookings',
            payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
            payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'miniapp-booking-submit-handler',
            idempotencyKey: 'miniapp-sync:auth-001'
        });
        strict_1.default.equal(denied.statusCode, 401);
        const forbidden = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/runtime-governance/actions')
            .set('x-actor-id', 'ops-admin')
            .set('x-roles', 'OPERATIONS')
            .set('x-permissions', 'foundation.runtime-governance.read')
            .send({
            app: 'miniapp',
            action: 'booking-submit',
            nextStep: 'PROCEED',
            riskLevel: 'medium',
            requestEndpoint: '/api/v1/storefront/bookings',
            payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
            payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'miniapp-booking-submit-handler',
            idempotencyKey: 'miniapp-sync:auth-001'
        });
        strict_1.default.equal(forbidden.statusCode, 403);
        const allowed = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/runtime-governance/actions')
            .set('x-tenant-id', 'tenant-runtime')
            .set('x-actor-id', 'ops-admin')
            .set('x-roles', 'OPERATIONS')
            .set('x-permissions', 'foundation.runtime-governance.write')
            .send({
            app: 'miniapp',
            action: 'booking-submit',
            nextStep: 'PROCEED',
            riskLevel: 'medium',
            requestEndpoint: '/api/v1/storefront/bookings',
            payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
            payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'miniapp-booking-submit-handler',
            idempotencyKey: 'miniapp-sync:auth-002'
        });
        const allowedPayload = allowed.body.data ?? allowed.body;
        strict_1.default.equal(allowed.statusCode, 201);
        strict_1.default.equal(allowedPayload.status, 'submitted');
        strict_1.default.equal(allowedPayload.input.tenantId, 'tenant-runtime');
        strict_1.default.equal(allowedPayload.input.actorId, 'ops-admin');
        const queryForbidden = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/runtime-governance/actions/RECEIPT-001')
            .set('x-actor-id', 'ops-admin')
            .set('x-roles', 'OPERATIONS')
            .set('x-permissions', 'foundation.runtime-governance.write');
        strict_1.default.equal(queryForbidden.statusCode, 403);
        const queryAllowed = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/runtime-governance/actions/RECEIPT-001')
            .set('x-actor-id', 'ops-admin')
            .set('x-roles', 'OPERATIONS')
            .set('x-permissions', 'foundation.runtime-governance.read');
        const queryPayload = queryAllowed.body.data ?? queryAllowed.body;
        strict_1.default.equal(queryAllowed.statusCode, 200);
        strict_1.default.equal(queryPayload.receiptCode, 'RECEIPT-001');
        strict_1.default.equal(runtimeCalls.some((item) => item.kind === 'query'), true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: configuration management endpoints enforce role and permission metadata', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAuthorizedConfigurationController],
        providers: [
            core_1.Reflector,
            identity_access_service_1.IdentityAccessService,
            {
                provide: configuration_governance_service_1.ConfigurationGovernanceService,
                useValue: {
                    saveConfigEntry: async () => ({ status: 'created' })
                }
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use((req, _res, next) => {
        attachRequestContext(req);
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalGuards(new identity_access_guard_1.IdentityAccessGuard(app.get(core_1.Reflector), app.get(identity_access_service_1.IdentityAccessService)));
    await app.init();
    try {
        const denied = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/configuration-governance/config-entries').send({
            namespace: 'checkout',
            key: 'paymentChannels',
            valueType: 'JSON',
            scopeType: 'TENANT',
            value: { channels: ['wechat-pay'] }
        });
        strict_1.default.equal(denied.statusCode, 401);
        const allowed = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/config-entries')
            .set('x-actor-id', 'ops-admin')
            .set('x-roles', 'TENANT_ADMIN')
            .set('x-permissions', 'foundation.config.write')
            .send({
            namespace: 'checkout',
            key: 'paymentChannels',
            valueType: 'JSON',
            scopeType: 'TENANT',
            value: { channels: ['wechat-pay'] }
        });
        const payload = allowed.body.data ?? allowed.body;
        strict_1.default.equal(allowed.statusCode, 201);
        strict_1.default.equal(payload.status, 'created');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: trust governance management endpoints enforce role and permission metadata', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAuthorizedTrustController],
        providers: [
            core_1.Reflector,
            identity_access_service_1.IdentityAccessService,
            {
                provide: trust_governance_service_1.TrustGovernanceService,
                useValue: {
                    resetQuotaLedgers: async () => ({ status: 'reset-bulk', count: 1, ledgers: [] })
                }
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use((req, _res, next) => {
        attachRequestContext(req);
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalGuards(new identity_access_guard_1.IdentityAccessGuard(app.get(core_1.Reflector), app.get(identity_access_service_1.IdentityAccessService)));
    await app.init();
    try {
        const denied = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/trust-governance/rate-limit/ledgers/reset')
            .set('x-actor-id', 'ops-admin')
            .set('x-roles', 'TENANT_ADMIN')
            .set('x-permissions', 'foundation.quota-ledger.reset')
            .send({ policyCode: 'login-ip', subjectKey: 'tenant-demo:login:127.0.0.1' });
        strict_1.default.equal(denied.statusCode, 403);
        const allowed = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/trust-governance/rate-limit/ledgers/reset')
            .set('x-actor-id', 'sec-admin')
            .set('x-roles', 'SECURITY_ADMIN')
            .set('x-permissions', 'foundation.quota-ledger.reset')
            .send({ policyCode: 'login-ip', subjectKey: 'tenant-demo:login:127.0.0.1' });
        const payload = allowed.body.data ?? allowed.body;
        strict_1.default.equal(allowed.statusCode, 201);
        strict_1.default.equal(payload.status, 'reset-bulk');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: foundation alert acknowledgement endpoints enforce role and permission metadata', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAuthorizedFoundationAlertsController],
        providers: [
            core_1.Reflector,
            identity_access_service_1.IdentityAccessService,
            {
                provide: foundation_service_1.FoundationService,
                useValue: {
                    acknowledgeOperationsAlert: async () => ({ status: 'acked' }),
                    muteOperationsAlert: async () => ({ status: 'muted' }),
                    unmuteOperationsAlert: async () => ({ status: 'unmuted' })
                }
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use((req, _res, next) => {
        attachRequestContext(req);
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalGuards(new identity_access_guard_1.IdentityAccessGuard(app.get(core_1.Reflector), app.get(identity_access_service_1.IdentityAccessService)));
    await app.init();
    try {
        const denied = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/overview/alerts/approvals-pending/ack').send({ note: 'ops' });
        strict_1.default.equal(denied.statusCode, 401);
        const forbidden = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/overview/alerts/approvals-pending/ack')
            .set('x-actor-id', 'ops-admin')
            .set('x-roles', 'OPERATIONS')
            .set('x-permissions', 'foundation.config.write')
            .send({ note: 'ops' });
        strict_1.default.equal(forbidden.statusCode, 403);
        const allowed = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/overview/alerts/approvals-pending/ack')
            .set('x-actor-id', 'ops-admin')
            .set('x-roles', 'OPERATIONS')
            .set('x-permissions', 'foundation.operations.alerts.write')
            .send({ note: 'ops' });
        const payload = allowed.body.data ?? allowed.body;
        strict_1.default.equal(allowed.statusCode, 201);
        strict_1.default.equal(payload.status, 'acked');
        const unmuted = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/overview/alerts/approvals-pending/unmute')
            .set('x-actor-id', 'ops-admin')
            .set('x-roles', 'OPERATIONS')
            .set('x-permissions', 'foundation.operations.alerts.write')
            .send({ note: 'restore visibility' });
        const unmutedPayload = unmuted.body.data ?? unmuted.body;
        strict_1.default.equal(unmuted.statusCode, 201);
        strict_1.default.equal(unmutedPayload.status, 'unmuted');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: foundation overview aggregates trust and configuration governance modules', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestFoundationOverviewController],
        providers: [
            {
                provide: foundation_service_1.FoundationService,
                useValue: {
                    getOperationsOverview: async () => ({
                        generatedAt: new Date().toISOString(),
                        summary: {
                            approvalsPending: 2,
                            approvalsWithFailures: 1,
                            highRiskAudits: 1,
                            blockedLedgers: 1,
                            rotationDueSecrets: 1,
                            expiredSecrets: 0,
                            expiringCertificates: 1,
                            expiredCertificates: 0,
                            degradedSignals: 2,
                            attentionRecoveryPlans: 1,
                            staleDrills: 1,
                            runtimeGovernanceBacklog: 2,
                            stalledRuntimeCallbacks: 1,
                            highRiskRuntimeBacklog: 1,
                            runtimeBlockedActions: 1
                        },
                        alerts: [
                            {
                                severity: 'medium',
                                code: 'approvals-pending',
                                count: 2,
                                summary: '存在待处理审批单'
                            },
                            {
                                severity: 'high',
                                code: 'runtime-callback-stalled',
                                count: 1,
                                summary: '存在等待 callback 回写的 runtime receipt'
                            },
                            {
                                severity: 'medium',
                                code: 'observability-degradation',
                                count: 2,
                                summary: '存在异常的 metrics/logs/traces 信号'
                            }
                        ],
                        topFailures: [{ module: 'trust-governance', code: 'reset-bulk-failed', count: 1 }],
                        topRisks: [
                            {
                                severity: 'medium',
                                code: 'approvals-pending',
                                count: 2,
                                summary: '存在待处理审批单'
                            },
                            {
                                severity: 'high',
                                code: 'runtime-callback-stalled',
                                count: 1,
                                summary: '存在等待 callback 回写的 runtime receipt'
                            }
                        ],
                        moduleHealth: {
                            trustGovernance: { score: 82, status: 'warning' },
                            configurationGovernance: { score: 91, status: 'healthy' },
                            resilienceOperations: { score: 74, status: 'warning' },
                            runtimeGovernance: { score: 63, status: 'warning' }
                        },
                        modules: {
                            trustGovernance: { approvals: { total: 2 }, audits: { total: 1 } },
                            configurationGovernance: { approvals: { total: 1 }, audits: { total: 1 } },
                            resilienceOperations: { observability: { degradedSignals: 2 }, recovery: { attentionRequired: 1 } },
                            runtimeGovernance: {
                                summary: { backlog: 2, stalledCallbacks: 1, highRiskBacklog: 1, blockedActions: 1 },
                                receipts: [{ receiptCode: 'RUNTIME-001' }]
                            }
                        }
                    }),
                    getOperationsAlerts: async () => ({
                        generatedAt: new Date().toISOString(),
                        alerts: [
                            {
                                severity: 'medium',
                                code: 'approvals-pending',
                                count: 2,
                                summary: '存在待处理审批单'
                            },
                            {
                                severity: 'medium',
                                code: 'observability-degradation',
                                count: 2,
                                summary: '存在异常的 metrics/logs/traces 信号'
                            },
                            {
                                severity: 'high',
                                code: 'runtime-callback-stalled',
                                count: 1,
                                summary: '存在等待 callback 回写的 runtime receipt'
                            }
                        ],
                        topRisks: [
                            {
                                severity: 'medium',
                                code: 'approvals-pending',
                                count: 2,
                                summary: '存在待处理审批单'
                            },
                            {
                                severity: 'high',
                                code: 'runtime-callback-stalled',
                                count: 1,
                                summary: '存在等待 callback 回写的 runtime receipt'
                            }
                        ]
                    }),
                    getOperationsAlertsCatalog: async () => ({
                        generatedAt: new Date().toISOString(),
                        alerts: [
                            {
                                code: 'approvals-pending',
                                defaultSummary: '存在待处理审批单',
                                severityPolicy: '待处理审批单数量 >= 5 时为 high，否则为 medium',
                                sourceModules: ['trust-governance', 'configuration-governance'],
                                drilldownEnabled: true,
                                acknowledgementEnabled: true,
                                drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
                                ackPath: '/foundation/overview/alerts/approvals-pending/ack',
                                mutePath: '/foundation/overview/alerts/approvals-pending/mute',
                                unmutePath: '/foundation/overview/alerts/approvals-pending/unmute'
                            },
                            {
                                code: 'observability-degradation',
                                defaultSummary: '存在异常的 metrics/logs/traces 信号',
                                severityPolicy: 'critical 信号存在时为 high，否则为 medium',
                                sourceModules: ['resilience-operations'],
                                drilldownEnabled: true,
                                acknowledgementEnabled: true,
                                drilldownPath: '/foundation/overview/alerts/observability-degradation/drilldown',
                                ackPath: '/foundation/overview/alerts/observability-degradation/ack',
                                mutePath: '/foundation/overview/alerts/observability-degradation/mute',
                                unmutePath: '/foundation/overview/alerts/observability-degradation/unmute'
                            },
                            {
                                code: 'runtime-callback-stalled',
                                defaultSummary: '存在等待 callback 回写的 runtime receipt',
                                severityPolicy: '只要存在等待 callback 的 receipt 即为 high',
                                sourceModules: ['runtime-governance'],
                                drilldownEnabled: true,
                                acknowledgementEnabled: true,
                                drilldownPath: '/foundation/overview/alerts/runtime-callback-stalled/drilldown',
                                ackPath: '/foundation/overview/alerts/runtime-callback-stalled/ack',
                                mutePath: '/foundation/overview/alerts/runtime-callback-stalled/mute',
                                unmutePath: '/foundation/overview/alerts/runtime-callback-stalled/unmute'
                            }
                        ]
                    }),
                    getOperationsAlertDrilldown: async (code) => ({
                        generatedAt: new Date().toISOString(),
                        code,
                        alert: {
                            severity: 'medium',
                            code,
                            count: 2,
                            summary: '存在待处理审批单'
                        },
                        detail: {
                            total: 2,
                            receipts: [{ receiptCode: 'RUNTIME-001', callback: { callbackStatus: 'awaiting-callback' } }]
                        }
                    }),
                    getOperationsModuleDetail: async (moduleKey) => ({
                        generatedAt: new Date().toISOString(),
                        moduleKey,
                        health: moduleKey === 'trust-governance'
                            ? { score: 82, status: 'warning' }
                            : moduleKey === 'configuration-governance'
                                ? { score: 91, status: 'healthy' }
                                : moduleKey === 'resilience-operations'
                                    ? { score: 74, status: 'warning' }
                                    : { score: 63, status: 'warning' },
                        detail: moduleKey === 'trust-governance'
                            ? { approvals: { total: 2 } }
                            : moduleKey === 'configuration-governance'
                                ? { approvals: { total: 1 } }
                                : moduleKey === 'resilience-operations'
                                    ? { observability: { degradedSignals: 2 } }
                                    : { summary: { backlog: 2 }, receipts: [{ receiptCode: 'RUNTIME-001' }] }
                    })
                }
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    try {
        const overview = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/overview');
        const payload = overview.body.data ?? overview.body;
        strict_1.default.equal(overview.statusCode, 200);
        strict_1.default.equal(payload.summary.approvalsPending, 2);
        strict_1.default.equal(payload.summary.rotationDueSecrets, 1);
        strict_1.default.equal(payload.summary.degradedSignals, 2);
        strict_1.default.equal(payload.summary.runtimeGovernanceBacklog, 2);
        strict_1.default.equal(payload.alerts[0].code, 'approvals-pending');
        strict_1.default.equal(payload.topFailures[0].code, 'reset-bulk-failed');
        strict_1.default.equal(payload.moduleHealth.trustGovernance.status, 'warning');
        strict_1.default.equal(payload.moduleHealth.runtimeGovernance.status, 'warning');
        strict_1.default.equal(payload.modules.trustGovernance.approvals.total, 2);
        strict_1.default.equal(payload.modules.resilienceOperations.observability.degradedSignals, 2);
        strict_1.default.equal(payload.modules.runtimeGovernance.summary.backlog, 2);
        const alerts = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/overview/alerts');
        const alertsPayload = alerts.body.data ?? alerts.body;
        strict_1.default.equal(alerts.statusCode, 200);
        strict_1.default.equal(alertsPayload.alerts[0].code, 'approvals-pending');
        const catalog = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/overview/alerts/catalog');
        const catalogPayload = catalog.body.data ?? catalog.body;
        strict_1.default.equal(catalog.statusCode, 200);
        strict_1.default.equal(catalogPayload.alerts[0].code, 'approvals-pending');
        strict_1.default.equal(catalogPayload.alerts.some((item) => item.code === 'runtime-callback-stalled'), true);
        const drilldown = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/overview/alerts/runtime-callback-stalled/drilldown');
        const drilldownPayload = drilldown.body.data ?? drilldown.body;
        strict_1.default.equal(drilldown.statusCode, 200);
        strict_1.default.equal(drilldownPayload.code, 'runtime-callback-stalled');
        strict_1.default.equal(drilldownPayload.detail.total, 2);
        const moduleDetail = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/overview/modules/trust-governance');
        const moduleDetailPayload = moduleDetail.body.data ?? moduleDetail.body;
        strict_1.default.equal(moduleDetail.statusCode, 200);
        strict_1.default.equal(moduleDetailPayload.moduleKey, 'trust-governance');
        strict_1.default.equal(moduleDetailPayload.health.status, 'warning');
        const resilienceModuleDetail = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/overview/modules/resilience-operations');
        const resilienceModuleDetailPayload = resilienceModuleDetail.body.data ?? resilienceModuleDetail.body;
        strict_1.default.equal(resilienceModuleDetail.statusCode, 200);
        strict_1.default.equal(resilienceModuleDetailPayload.moduleKey, 'resilience-operations');
        strict_1.default.equal(resilienceModuleDetailPayload.health.status, 'warning');
        const runtimeModuleDetail = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/overview/modules/runtime-governance');
        const runtimeModuleDetailPayload = runtimeModuleDetail.body.data ?? runtimeModuleDetail.body;
        strict_1.default.equal(runtimeModuleDetail.statusCode, 200);
        strict_1.default.equal(runtimeModuleDetailPayload.moduleKey, 'runtime-governance');
        strict_1.default.equal(runtimeModuleDetailPayload.health.status, 'warning');
    }
    finally {
        await app.close();
    }
});
async function buildAuthApp(controllers, extraProviders = []) {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers,
        providers: [core_1.Reflector, identity_access_service_1.IdentityAccessService, ...(extraProviders ?? [])]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use((req, _res, next) => {
        attachRequestContext(req);
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalGuards(new identity_access_guard_1.IdentityAccessGuard(app.get(core_1.Reflector), app.get(identity_access_service_1.IdentityAccessService)));
    await app.init();
    return app;
}
(0, node_test_1.default)('e2e: mute alert endpoint sets muted status', async () => {
    const app = await buildAuthApp([TestAuthorizedFoundationAlertsController], [
        {
            provide: foundation_service_1.FoundationService,
            useValue: {
                acknowledgeOperationsAlert: async () => ({ status: 'acked' }),
                muteOperationsAlert: async () => ({ status: 'muted' }),
                unmuteOperationsAlert: async () => ({ status: 'unmuted' })
            }
        }
    ]);
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/overview/alerts/approvals-pending/mute')
            .set('x-actor-id', 'ops-admin')
            .set('x-roles', 'OPERATIONS')
            .set('x-permissions', 'foundation.operations.alerts.write')
            .send({ mutedUntil: '2026-12-31T23:59:59.000Z', note: 'temporary mute' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(data.status, 'muted');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: permission wildcard (*) grants access to any permission', async () => {
    let WildcardController = class WildcardController {
        test() {
            return { ok: true };
        }
    };
    __decorate([
        (0, common_1.Get)('test'),
        (0, identity_access_decorator_1.RequirePermissions)('foundation.anything.read'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], WildcardController.prototype, "test", null);
    WildcardController = __decorate([
        (0, common_1.Controller)('foundation'),
        (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN')
    ], WildcardController);
    const app = await buildAuthApp([WildcardController]);
    try {
        const forbidden = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/test')
            .set('x-actor-id', 'u')
            .set('x-roles', 'SUPER_ADMIN')
            .set('x-permissions', 'foundation.specific.read');
        strict_1.default.equal(forbidden.statusCode, 403);
        const allowed = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/test')
            .set('x-actor-id', 'u')
            .set('x-roles', 'SUPER_ADMIN')
            .set('x-permissions', '*');
        strict_1.default.equal(allowed.statusCode, 200);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: configuration management with wrong role returns 403', async () => {
    const app = await buildAuthApp([TestAuthorizedConfigurationController], [
        {
            provide: configuration_governance_service_1.ConfigurationGovernanceService,
            useValue: {
                saveConfigEntry: async () => ({ status: 'created' })
            }
        }
    ]);
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/config-entries')
            .set('x-tenant-id', 'tenant-demo')
            .set('x-actor-id', 'cashier')
            .set('x-roles', 'STORE_MANAGER')
            .set('x-permissions', 'foundation.config.write')
            .send({
            tenantId: 'tenant-demo',
            namespace: 'checkout',
            key: 'paymentChannels',
            valueType: 'JSON',
            scopeType: 'TENANT',
            value: { channels: ['wechat-pay'] }
        });
        strict_1.default.equal(res.statusCode, 403);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: configuration management accepts matching tenantId', async () => {
    const app = await buildAuthApp([TestAuthorizedConfigurationController], [
        {
            provide: configuration_governance_service_1.ConfigurationGovernanceService,
            useValue: {
                saveConfigEntry: async () => ({ status: 'created' })
            }
        }
    ]);
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/config-entries')
            .set('x-tenant-id', 'tenant-demo')
            .set('x-actor-id', 'u')
            .set('x-roles', 'TENANT_ADMIN')
            .set('x-permissions', 'foundation.config.write')
            .send({
            tenantId: 'tenant-demo',
            namespace: 'checkout',
            key: 'paymentChannels',
            valueType: 'JSON',
            scopeType: 'TENANT',
            value: { channels: ['wechat-pay'] }
        });
        strict_1.default.equal(res.statusCode, 201);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: unauthenticated request without actor header returns 401', async () => {
    const app = await buildAuthApp([TestAuthorizedConfigurationController], [
        {
            provide: configuration_governance_service_1.ConfigurationGovernanceService,
            useValue: {
                saveConfigEntry: async () => ({ status: 'created' })
            }
        }
    ]);
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/config-entries')
            .send({
            tenantId: 'tenant-demo',
            namespace: 'checkout',
            key: 'x',
            valueType: 'JSON',
            scopeType: 'TENANT',
            value: {}
        });
        strict_1.default.equal(res.statusCode, 401);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: runtime governance reject without x-tenant-id header still 401 unauthenticated', async () => {
    const app = await buildAuthApp([TestAuthorizedRuntimeGovernanceController], [
        {
            provide: runtime_governance_service_1.RuntimeGovernanceService,
            useValue: {
                submitAction: async () => ({}),
                getActionReceipt: async () => ({}),
                syncAction: async () => ({}),
                recordCallback: async () => ({}),
                replayAction: async () => ({})
            }
        }
    ]);
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/runtime-governance/actions/RECEIPT-X');
        strict_1.default.equal(res.statusCode, 401);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: runtime governance reject without required role', async () => {
    const app = await buildAuthApp([TestAuthorizedRuntimeGovernanceController], [
        {
            provide: runtime_governance_service_1.RuntimeGovernanceService,
            useValue: {
                submitAction: async () => ({}),
                getActionReceipt: async () => ({}),
                syncAction: async () => ({}),
                recordCallback: async () => ({}),
                replayAction: async () => ({})
            }
        }
    ]);
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/runtime-governance/actions')
            .set('x-tenant-id', 'tenant-demo')
            .set('x-actor-id', 'cashier')
            .set('x-roles', 'STORE_MANAGER')
            .set('x-permissions', 'foundation.runtime-governance.write')
            .send({
            app: 'miniapp',
            action: 'submit',
            nextStep: 'PROCEED',
            riskLevel: 'medium',
            requestEndpoint: '/api/v1/x',
            payload: {},
            payloadSummary: '{}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'h',
            idempotencyKey: 'idem-2'
        });
        strict_1.default.equal(res.statusCode, 403);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: trust governance reset accepts SECURITY_ADMIN role', async () => {
    const app = await buildAuthApp([TestAuthorizedTrustController], [
        {
            provide: trust_governance_service_1.TrustGovernanceService,
            useValue: {
                resetQuotaLedgers: async () => ({ status: 'reset-bulk', count: 1, ledgers: [] })
            }
        }
    ]);
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/trust-governance/rate-limit/ledgers/reset')
            .set('x-actor-id', 'sec-admin')
            .set('x-roles', 'SECURITY_ADMIN')
            .set('x-permissions', 'foundation.quota-ledger.reset')
            .send({ policyCode: 'login-ip', subjectKey: 'tenant-demo:login:127.0.0.1' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(data.status, 'reset-bulk');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=foundation-management-authorization.e2e.test.js.map