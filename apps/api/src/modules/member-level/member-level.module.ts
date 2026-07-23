import { Module } from '@nestjs/common'
import { MemberLevelController } from './member-level.controller'
import { MemberLevelService } from './member-level.service'
import { MemberLevelDecayService } from './member-level-decay.service'

@Module({
  controllers: [MemberLevelController],
  providers: [MemberLevelService, MemberLevelDecayService],
  exports: [MemberLevelService, MemberLevelDecayService]
})
export class MemberLevelModule {}
