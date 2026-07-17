import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StockController } from './stock.controller'
import { StockService } from './stock.service'
import { StockItem } from './stock-item.entity'
import { StockTransaction } from './stock-transaction.entity'

/**
 * StockModule · 库存管理模块
 *
 * 包含:
 *  - StockController / StockService: 库存商品 CRUD + 出入库管理 + 交易记录 + 低库存告警
 *  - StockItem / StockTransaction: TypeORM 实体
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([StockItem, StockTransaction]),
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
