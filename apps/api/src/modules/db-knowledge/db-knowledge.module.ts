/**
 * db-knowledge.module.ts — 数据库知识库模块
 *
 * 当 PostgreSQL 可用时提供 DB 驱动的知识查询
 * 降级友好: DB不可用时返回空数组(仍使用文件方式)
 */

import { Module } from '@nestjs/common'
import { DbKnowledgeController } from './db-knowledge.controller'
import { DbKnowledgeService } from './db-knowledge.service'

@Module({
  controllers: [DbKnowledgeController],
  providers: [DbKnowledgeService],
  exports: [DbKnowledgeService],
})
export class DbKnowledgeModule {}
