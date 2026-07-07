/**
 * 🐜 自动: [ops-manual] [A] module 补全
 *
 * 运营手册模块 - 提供运营手册生成、导出、搜索功能
 */

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OpsManualController } from './ops-manual.controller'
import { OpsManualService } from './ops-manual.service'
import { OpsManualRecord, OpsManualSearchLog } from './ops-manual.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([OpsManualRecord, OpsManualSearchLog]),
  ],
  controllers: [OpsManualController],
  providers: [OpsManualService],
  exports: [OpsManualService],
})
export class OpsManualModule {}
