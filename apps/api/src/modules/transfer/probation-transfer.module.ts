import { Module } from '@nestjs/common'
import { ProbationTransferController } from './probation-transfer.controller'
import { ProbationTransferService } from './probation-transfer.service'

@Module({
  controllers: [ProbationTransferController],
  providers: [ProbationTransferService],
  exports: [ProbationTransferService],
})
export class ProbationTransferModule {}
