import { Module } from '@nestjs/common'
import { MemberLevelController } from './member-level.controller'
import { MemberLevelService } from './member-level.service'

@Module({
  controllers: [MemberLevelController],
  providers: [MemberLevelService],
  exports: [MemberLevelService]
})
export class MemberLevelModule {}
