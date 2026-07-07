import { Module } from '@nestjs/common'
import { RecommenderController } from './recommender.controller'
import { RecommenderService } from './recommender.service'
import { ContextBuilderService } from './context-builder.service'
import { RagRetrievalService } from './rag-retrieval.service'
import { PersonalizedRecommenderService } from './personalized-recommender.service'
import { KnowledgeModule } from '../knowledge/knowledge.module'

@Module({
  imports: [KnowledgeModule],
  controllers: [RecommenderController],
  providers: [
    RecommenderService,
    ContextBuilderService,
    RagRetrievalService,
    PersonalizedRecommenderService,
  ],
  exports: [
    RecommenderService,
    ContextBuilderService,
    RagRetrievalService,
    PersonalizedRecommenderService,
  ],
})
export class RecommenderModule {}
