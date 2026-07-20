/**
 * Phase V23 OSS 文件管理 Module (V23 Sprint Day 21-22)
 */

import { Module, Global } from '@nestjs/common'
import { OssService } from './oss.service'
import { OssController } from './oss.controller'

@Global()
@Module({
  providers: [OssService],
  controllers: [OssController],
  exports: [OssService],
})
export class OssModule {}
