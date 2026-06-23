import { Module } from '@nestjs/common'
import { SvipController } from './svip.controller'
import { SvipService } from './svip.service'

@Module({
  controllers: [SvipController],
  providers: [SvipService],
  exports: [SvipService]
})
export class SvipModule {}
