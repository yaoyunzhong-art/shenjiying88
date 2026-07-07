/**
 * knowledge.module.ts — 知识库模块
 *
 * 提供: KnowledgeController (API 端点)
 *       KnowledgeService (业务层)
 *       KnowledgeIndexerService (底层索引引擎)
 */

import { Module } from '@nestjs/common'
import { KnowledgeController } from './knowledge.controller'
import { KnowledgeService } from './knowledge.service'
import { KnowledgeIndexerService } from './knowledge-indexer.service'

@Module({
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeIndexerService],
  exports: [KnowledgeService, KnowledgeIndexerService],
})
export class KnowledgeModule {}
