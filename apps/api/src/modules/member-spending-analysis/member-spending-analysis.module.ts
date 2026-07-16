import { Module } from '@nestjs/common'
import { MemberSpendingAnalysisController } from './member-spending-analysis.controller'
import { MemberSpendingAnalysisService } from './member-spending-analysis.service'

@Module({
  controllers: [MemberSpendingAnalysisController],
  providers: [MemberSpendingAnalysisService],
  exports: [MemberSpendingAnalysisService]
})
export class MemberSpendingAnalysisModule {}
