import { Module } from '@nestjs/common'
import { ContractManagerController } from './contract-manager.controller'
import { ContractManagerService } from './contract-manager.service'

@Module({
  controllers: [ContractManagerController],
  providers: [ContractManagerService],
  exports: [ContractManagerService],
})
export class ContractManagerModule {}
