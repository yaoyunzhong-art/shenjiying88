/**
 * devops.module.ts — DevOps 模块
 *
 * 🐜 V17: 模块补齐
 *
 * 提供 CI/CD 流水线管理与运维服务。
 */

import { Module } from '@nestjs/common'
import { DevopsController } from './devops.controller'
import { DevopsService } from './devops.service'

@Module({
  controllers: [DevopsController],
  providers: [DevopsService],
  exports: [DevopsService],
})
export class DevopsModule {}
