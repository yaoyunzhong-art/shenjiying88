/**
 * 费用报销 - Module (V23)
 */

import { Module, Global } from '@nestjs/common'
import { ExpenseController } from './expense.controller'
import { ExpenseService } from './expense.service'

@Global()
@Module({
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
