/**
 * omnichannel.module.ts - 全渠道触达 Module
 */

import { Module } from '@nestjs/common'
import { OmnichannelReachService, SMSDualChannelService, InternationalEmailService } from './omnichannel.service'
import { OmnichannelController } from './omnichannel.controller'

@Module({
  providers: [
    OmnichannelReachService,
    SMSDualChannelService,
    InternationalEmailService,
  ],
  controllers: [OmnichannelController],
  exports: [
    OmnichannelReachService,
    SMSDualChannelService,
    InternationalEmailService,
  ],
})
export class OmnichannelModule {}
