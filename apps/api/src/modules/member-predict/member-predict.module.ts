import { Module } from '@nestjs/common'
import { MemberPredictController } from './member-predict.controller'
import { MemberPredictService } from './member-predict.service'

@Module({
  controllers: [MemberPredictController],
  providers: [MemberPredictService],
  exports: [MemberPredictService]
})
export class MemberPredictModule {}
