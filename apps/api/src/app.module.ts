import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TrafficGovernanceGuard } from './common/guards/traffic-governance.guard';
import { RequestGovernanceService } from './common/governance/request-governance.service';
import { RequestAuditInterceptor } from './common/interceptors/request-audit.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import configuration from './config/configuration';
import { envValidation, getEnv } from './config/env.validation';
import { CacheModule } from './infrastructure/cache/cache.module';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { CashierModule } from './modules/cashier/cashier.module';
import { CrossModuleModule } from './modules/cross-module/cross-module.module';
import { FoundationModule } from './modules/foundation/foundation.module';
import { IdentityAccessGuard } from './modules/foundation/identity-access/identity-access.guard';
import { HealthModule } from './modules/health/health.module';
import { LytModule } from './modules/lyt/lyt.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { MarketModule } from './modules/market/market.module';
import { MemberModule } from './modules/member/member.module';
import { PortalModule } from './modules/portal/portal.module';
import { TenantMiddleware } from './modules/tenant/tenant.middleware';
import { TenantModule } from './modules/tenant/tenant.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { PrismaModule } from './prisma/prisma.module';
import { AiRuleEngineModule } from './modules/ai-rule-engine/ai-rule-engine.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { WorkbenchModule } from './modules/workbench/workbench.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SvipModule } from './modules/svip/svip.module';
import { BlindboxModule } from './modules/blindbox/blindbox.module';
import { AiDiagnosisModule } from './modules/ai-diagnosis/ai-diagnosis.module';
import { AiRecommendModule } from './modules/ai-recommend/ai-recommend.module';
import { AiInsightModule } from './modules/ai-insight/ai-insight.module';
import { TournamentModule } from './modules/tournament/tournament.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { ReferralModule } from './modules/referral/referral.module';
import { ChampionModule } from './modules/champion/champion.module';
import { AIReviewModule } from './modules/ai-review/ai-review.module';
import { AIReviewerModule } from './modules/ai-reviewer/ai-reviewer.module';
import { MetricsModule } from './modules/observability/metrics.module';
import { LoggerModule } from './modules/observability/logger/logger.module';
import { TracingModule } from './modules/observability/tracing/tracing.module';
import { AnomalyDetectorModule } from './modules/anomaly-detector/anomaly-detector.module';
import { TimeSeriesModule } from './modules/time-series/time-series.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { LeadsModule } from './modules/leads/leads.module';
import { PerfMonitorModule } from './modules/perf-monitor/perf-monitor.module';
import { AutoRollbackModule } from './modules/auto-rollback/auto-rollback.module';
import { MarketingMetricsModule } from './modules/marketing-metrics/marketing-metrics.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { RecommenderModule } from './modules/recommender/recommender.module';
import { AiCsModule } from './modules/ai-cs/ai-cs.module';
import { AiContentModule } from './modules/ai-content/ai-content.module';
import { AIOpsModule } from './modules/aiops/aiops.module';
import { HealthDashboardModule } from './modules/health-dashboard/health-dashboard.module';
import { MultiRegionModule } from './modules/multi-region/multi-region.module';
import { E2EAutoGenModule } from './modules/e2e-auto-gen/e2e-auto-gen.module';
import { AgentModule } from './modules/agent/agent.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { FinanceModule } from './modules/finance/finance.module';
import { FinancePaymentModule } from './modules/finance/finance-payment.module';
import { I18nModule } from './modules/i18n/i18n.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { InventoryItemModule } from './modules/inventory/inventory-item.module';
import { QueueModule } from './modules/queue/queue.module';
import { RetrievalModule } from './modules/retrieval/retrieval.module';
import { RecommendModule } from './modules/recommend/recommend.module';
import { SharedModule } from './modules/shared/shared.module';
import { ReportModule } from './modules/reports/report.module';
import { TenantConfigModule } from './modules/tenant-config/tenant-config.module';
import { MemberLevelModule } from './modules/member-level/member-level.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { VoiceProcessingModule } from './modules/voice-processing/voice-processing.module';
import { ImageRecognitionModule } from './modules/image-recognition/image-recognition.module'
import { PerformanceModule } from './modules/performance/performance.module'
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { MultimediaModule } from './modules/multimedia/multimedia.module';
import { FederatedLearningModule } from './modules/federated-learning/federated.module';
import { PointsModule } from './modules/points/points.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrandCustomModule } from './modules/brand-custom/brand-custom.module';
import { AiSalesModule } from './modules/ai-sales/ai-sales.module';
import { AllianceModule } from './modules/alliance/alliance.module';
import { DeployModule } from './modules/deploy/deploy.module';
import { AuditModule } from './modules/audit/audit.module';
import { AiPushModule } from './modules/ai-push/ai-push.module';
import { DeviceAdapterModule } from './modules/device-adapter/device-adapter.module';
import { EdgeModule } from './modules/edge/edge.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { ChaosEngineeringModule } from './modules/chaos/chaos-engineering.module';
import { SecurityModule } from './modules/security/security.module';
import { ChainModule } from './modules/chain/chain.module';
import { OpsManualModule } from './modules/ops-manual/ops-manual.module';
import { SaaSBillingModule } from './modules/saas-billing/saas-billing.module';
import { LowcodeModule } from './modules/lowcode/lowcode.module';
import { SandboxModule } from './modules/sandbox/sandbox.module';
import { DocModule } from './modules/docs/doc.module';
import { ContentModule } from './modules/content/content.module';
import { SessionModule } from './modules/session/session.module';
import { RunbookModule } from './modules/runbook/runbook.module';
import { RBACModule } from './modules/rbac/rbac.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { PaymentGatewayModule } from './modules/payment-gateway/payment-gateway.module';
import { ReportModule as ReportModuleStandalone } from './modules/report/report.module';
import { LicensePackageModule } from './modules/license-package/license-package.module';
import { InsightModule } from './modules/insight/insight.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { PermissionModule } from './modules/permission/permission.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { AiMarketingModule } from './modules/ai-marketing/ai-marketing.module';
import { OpenAPIModule } from './modules/openapi/openapi.module';
import { LocaleModule } from './modules/locale/locale.module';
import { DbKnowledgeModule } from './modules/db-knowledge/db-knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: envValidation,
    }),
    // 基础设施层 (Phase-13)
    // RedisModule: lazy connect,启动不阻塞
    // CacheModule: in-memory fallback,Redis 不可用时降级
    // EventBusModule: in-memory 后端,业务模块不感知
    RedisModule.forRootAsync({
      useFactory: () => {
        const env = getEnv()
        return {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD,
          db: env.REDIS_DB,
        }
      },
    }),
    CacheModule.forRootInMemory(),
    EventBusModule.forRootInMemory(),
    PrismaModule,
    TenantModule,
    BootstrapModule,
    CashierModule,
    CrossModuleModule,
    FoundationModule,
    LytModule,
    LoyaltyModule,
    MemberModule,
    MarketModule,
    PortalModule,
    TransactionsModule,
    AiRuleEngineModule,
    AnalyticsModule,
    CampaignModule,
    HealthModule,
    WorkbenchModule,
    NotificationModule,
    AiDiagnosisModule,
    SvipModule,
    BlindboxModule,
    AiRecommendModule,
    AiInsightModule,
    TournamentModule,
    CouponModule,
    ReferralModule,
    ChampionModule,
    AIReviewModule,
    AIReviewerModule,
    MetricsModule,
    LoggerModule,
    TracingModule,
    AnomalyDetectorModule,
    TimeSeriesModule,
    KnowledgeModule,
    LeadsModule,
    PerfMonitorModule,
    AutoRollbackModule,
    MarketingModule,
    MarketingMetricsModule,
    RecommenderModule,
    AiCsModule,
    AiContentModule,
    AIOpsModule,
    HealthDashboardModule,
    MultiRegionModule,
    E2EAutoGenModule,
    AgentModule,
    ReservationModule,
    ComplianceModule,
    FinanceModule,
    FinancePaymentModule,
    I18nModule,
    InventoryModule,
    InventoryItemModule,
    QueueModule,
    RetrievalModule,
    RecommendModule,
    ReportModule,
    SharedModule,
    TenantConfigModule,
    MemberLevelModule,
    OcrModule,
    VoiceProcessingModule,
    ImageRecognitionModule,
    PerformanceModule,
    MonitoringModule,
    MultimediaModule,
    FederatedLearningModule,
    PointsModule,
    AuthModule,
    BrandCustomModule,
    AiSalesModule,
    AllianceModule,
    DeployModule,
    AuditModule,
    AiPushModule,
    DeviceAdapterModule,
    EdgeModule,
    GatewayModule,
    ChaosEngineeringModule,
    SecurityModule,
    ChainModule,
    OpsManualModule,
    SaaSBillingModule,
    LowcodeModule,
    SandboxModule,
    DocModule,
    ContentModule,
    SessionModule,
    RunbookModule,
    RBACModule,
    RealtimeModule,
    PaymentGatewayModule,
    ReportModuleStandalone,
    LicensePackageModule,
    InsightModule,
    WebhookModule,
    PermissionModule,
    CurrencyModule,
    AiMarketingModule,
    OpenAPIModule,
    LocaleModule,
    DbKnowledgeModule,
  ],
  providers: [
    RequestGovernanceService,
    {
      provide: APP_GUARD,
      useClass: TrafficGovernanceGuard,
    },
    {
      provide: APP_GUARD,
      useClass: IdentityAccessGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestAuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
