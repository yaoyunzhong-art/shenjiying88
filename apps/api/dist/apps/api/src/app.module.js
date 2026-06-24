"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const traffic_governance_guard_1 = require("./common/guards/traffic-governance.guard");
const request_governance_service_1 = require("./common/governance/request-governance.service");
const request_audit_interceptor_1 = require("./common/interceptors/request-audit.interceptor");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const configuration_1 = __importDefault(require("./config/configuration"));
const env_validation_1 = require("./config/env.validation");
const bootstrap_module_1 = require("./modules/bootstrap/bootstrap.module");
const cashier_module_1 = require("./modules/cashier/cashier.module");
const cross_module_module_1 = require("./modules/cross-module/cross-module.module");
const foundation_module_1 = require("./modules/foundation/foundation.module");
const identity_access_guard_1 = require("./modules/foundation/identity-access/identity-access.guard");
const health_module_1 = require("./modules/health/health.module");
const lyt_module_1 = require("./modules/lyt/lyt.module");
const loyalty_module_1 = require("./modules/loyalty/loyalty.module");
const market_module_1 = require("./modules/market/market.module");
const member_module_1 = require("./modules/member/member.module");
const portal_module_1 = require("./modules/portal/portal.module");
const tenant_middleware_1 = require("./modules/tenant/tenant.middleware");
const tenant_module_1 = require("./modules/tenant/tenant.module");
const transactions_module_1 = require("./modules/transactions/transactions.module");
const prisma_module_1 = require("./prisma/prisma.module");
const ai_rule_engine_module_1 = require("./modules/ai-rule-engine/ai-rule-engine.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const campaign_module_1 = require("./modules/campaign/campaign.module");
const workbench_module_1 = require("./modules/workbench/workbench.module");
const notification_module_1 = require("./modules/notification/notification.module");
const svip_module_1 = require("./modules/svip/svip.module");
const ai_diagnosis_module_1 = require("./modules/ai-diagnosis/ai-diagnosis.module");
const ai_recommend_module_1 = require("./modules/ai-recommend/ai-recommend.module");
const ai_insight_module_1 = require("./modules/ai-insight/ai-insight.module");
const tournament_module_1 = require("./modules/tournament/tournament.module");
const metrics_module_1 = require("./modules/observability/metrics.module");
const logger_module_1 = require("./modules/observability/logger/logger.module");
const tracing_module_1 = require("./modules/observability/tracing/tracing.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(tenant_middleware_1.TenantMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                validate: env_validation_1.envValidation,
            }),
            prisma_module_1.PrismaModule,
            tenant_module_1.TenantModule,
            bootstrap_module_1.BootstrapModule,
            cashier_module_1.CashierModule,
            cross_module_module_1.CrossModuleModule,
            foundation_module_1.FoundationModule,
            lyt_module_1.LytModule,
            loyalty_module_1.LoyaltyModule,
            member_module_1.MemberModule,
            market_module_1.MarketModule,
            portal_module_1.PortalModule,
            transactions_module_1.TransactionsModule,
            ai_rule_engine_module_1.AiRuleEngineModule,
            analytics_module_1.AnalyticsModule,
            campaign_module_1.CampaignModule,
            health_module_1.HealthModule,
            workbench_module_1.WorkbenchModule,
            notification_module_1.NotificationModule,
            ai_diagnosis_module_1.AiDiagnosisModule,
            svip_module_1.SvipModule,
            ai_recommend_module_1.AiRecommendModule,
            ai_insight_module_1.AiInsightModule,
            tournament_module_1.TournamentModule,
            metrics_module_1.MetricsModule,
            logger_module_1.LoggerModule,
            tracing_module_1.TracingModule,
        ],
        providers: [
            request_governance_service_1.RequestGovernanceService,
            {
                provide: core_1.APP_GUARD,
                useClass: traffic_governance_guard_1.TrafficGovernanceGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: identity_access_guard_1.IdentityAccessGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: request_audit_interceptor_1.RequestAuditInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_interceptor_1.ResponseInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: all_exceptions_filter_1.AllExceptionsFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map