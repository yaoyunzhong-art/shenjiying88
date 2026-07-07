/**
 * ai-rag.module.ts - RAG 知识库模块
 */

import { Module } from '@nestjs/common'
import { AiRagController } from './ai-rag.controller'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from './ai-rag.service'

@Module({
  controllers: [AiRagController],
  providers: [KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator],
  exports: [KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator],
})
export class AiRagModule {}
