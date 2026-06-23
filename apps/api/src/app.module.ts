import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TrafficGovernanceGuard } from './common/guards/traffic-governance.guard';
import { RequestGovernanceService } from './common/governance/request-governance.service';
import { RequestAuditInterceptor } from './common/interceptors/request-audit.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import configuration from './config/configuration';
import { envValidation } from './config/env.validation';
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
import { AiDiagnosisModule } from './modules/ai-diagnosis/ai-diagnosis.module';
import { AiRecommendModule } from './modules/ai-recommend/ai-recommend.module';
import { AiInsightModule } from './modules/ai-insight/ai-insight.module';
import { TournamentModule } from './modules/tournament/tournament.module';
import { MetricsModule } from './modules/observability/metrics.module';
import { LoggerModule } from './modules/observability/logger/logger.module';
import { TracingModule } from './modules/observability/tracing/tracing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: envValidation,
    }),
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
    AiRecommendModule,
    AiInsightModule,
    TournamentModule,
    MetricsModule,
    LoggerModule,
    TracingModule,
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
