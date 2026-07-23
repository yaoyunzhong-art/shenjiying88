/**
 * terminal.module.ts — 排队终端模块
 *
 * WP-12B BS-0161~BS-0163
 * - 终端心跳检测
 * - 终端 2FA 认证（终端+操作员+门店三重绑定）
 * - 离线检测与自动恢复
 */

import { Module } from '@nestjs/common'
import { TerminalController } from './terminal.controller'
import { TerminalService } from './terminal.service'

@Module({
  controllers: [TerminalController],
  providers: [TerminalService],
  exports: [TerminalService],
})
export class TerminalModule {}
