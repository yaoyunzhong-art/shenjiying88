import { Module } from '@nestjs/common'
import { RecommendController } from './recommend.controller'
import { RecommendService } from './recommend.service'
import { RecommendationEngine } from './recommendation.engine'
import { ScoringService } from './scoring.service'
import { DiversificationService } from './diversification.service'
import { ColdStartService } from './cold-start.service'
import { RecommendCacheService } from './recommend-cache.service'
import { ProductAdapter } from './datasources/product.adapter'
import { PurchaseHistoryAdapter } from './datasources/purchase-history.adapter'
import { MemberPreferenceAdapter } from './datasources/member-preference.adapter'
import { ItemCFStrategy } from './strategies/item-cf.strategy'
import { UserCFStrategy } from './strategies/user-cf.strategy'
import { PopularStrategy } from './strategies/popular.strategy'
import { RecentlyViewedStrategy } from './strategies/recently-viewed.strategy'
import { PersonalizedStrategy } from './strategies/personalized.strategy'
import { SimilarityMatrixService } from './similarity-matrix.service'
import { TimeDecayService } from './time-decay.service'
import { ImplicitFeedbackService } from './implicit-feedback.service'
import { OfflineEvaluationService } from './offline-evaluation.service'

/**
 * Phase-40 T170 + V18 Day2 D3: RecommendModule
 *
 * 19 providers:
 *  - 5 核心 service (Scoring / Diversification / ColdStart / Cache / Recommend)
 *  - 3 adapter (Product / PurchaseHistory / MemberPreference)
 *  - 5 策略 (ItemCF / UserCF / Popular / RecentlyViewed / Personalized)
 *  - 4 V18 D3 新增: SimilarityMatrix / TimeDecay / ImplicitFeedback / OfflineEvaluation
 *  - 1 主引擎
 *  - 1 Controller
 */

@Module({
  controllers: [RecommendController],
  providers: [
    // 核心 service
    RecommendService,
    ScoringService,
    DiversificationService,
    ColdStartService,
    RecommendCacheService,
    // Adapter
    ProductAdapter,
    PurchaseHistoryAdapter,
    MemberPreferenceAdapter,
    // 策略
    ItemCFStrategy,
    UserCFStrategy,
    PopularStrategy,
    RecentlyViewedStrategy,
    PersonalizedStrategy,
    // V18 D3: CF 增强
    SimilarityMatrixService,
    TimeDecayService,
    ImplicitFeedbackService,
    // V18 D3: 离线评估
    OfflineEvaluationService,
    // 主引擎
    RecommendationEngine
  ],
  exports: [
    RecommendService,
    RecommendationEngine,
    RecommendCacheService,
    ProductAdapter,
    PurchaseHistoryAdapter,
    MemberPreferenceAdapter,
    // V18 D3
    SimilarityMatrixService,
    TimeDecayService,
    ImplicitFeedbackService,
    OfflineEvaluationService
  ]
})
export class RecommendModule {}