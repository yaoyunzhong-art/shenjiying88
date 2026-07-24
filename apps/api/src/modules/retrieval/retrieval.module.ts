/**
 * retrieval.module.ts · RAG 检索模块定义 (Phase-19 脚手架)
 *
 * 当前模块骨架,导出:
 *   - RetrievalService     供其他模块 (ai-review / rfc-drafter) 调用
 *   - QdrantClientWrapper  供 scripts/index-codebase.py 通过 Nest app context 调用
 *   - EmbeddingService     同上
 *
 * 注册流程 (Pulse-71):
 *   1. 在 app.module.ts 中 import RetrievalModule
 *   2. 通过 forFeature 注入 retrievalConfig
 *   3. 启动时 QdrantClientWrapper.onModuleInit 自动 ensureCollection
 *
 * ⚠️  当前 skeleton 状态:
 *   - Pulse-71 醒神完成: service 已实现 Cache→Embed→Search→Rerank 全链
 *   - 不在 app.module.ts 中注册 (避免启动报错),由 Pulse-71 接入
 */

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CacheModule } from '../../infrastructure/cache/cache.module'
import { retrievalConfig } from './config/retrieval.config'
import { QdrantClientWrapper } from './retrieval.client'
import { EmbeddingService } from './retrieval.embedder'
import { RetrievalService } from './retrieval.service'
import { RetrievalController } from './retrieval.controller'
import { RetrievalHealthController } from './health.controller'

// 导出 BM25 工具库 (供 retrieval.service.ts / scripts/eval-bm25.py 使用)
export * from './retrieval.bm25'

@Module({
  imports: [
    ConfigModule.forFeature(retrievalConfig),
    // CacheModule: 注入 Redis cache (Pulse-71 接入), 当前脚手架阶段保留 import
    // 以保留依赖关系,但 @Optional() 修饰保证 cache 缺失时不报错
    CacheModule.forRootInMemory(),
  ],
  controllers: [RetrievalController, RetrievalHealthController],
  providers: [
    QdrantClientWrapper,
    EmbeddingService,
    RetrievalService,
  ],
  exports: [
    RetrievalService,
    QdrantClientWrapper,
    EmbeddingService,
  ],
})
export class RetrievalModule {}