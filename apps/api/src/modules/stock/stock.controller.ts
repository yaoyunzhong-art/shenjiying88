import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import { StockService } from './stock.service'
import { StockItem } from './stock-item.entity'
import { StockTransaction, StockTransactionType } from './stock-transaction.entity'

@ApiTags('库存管理')
@ApiBearerAuth()
@Controller('stock/items')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ─── 列表 ───────────────────────────────────────

  @Get()
  @ApiOperation({ summary: '获取库存商品列表', description: '按门店和品类筛选库存商品' })
  @ApiOkResponse({ type: StockItem, isArray: true })
  list(
    @Query('storeId') storeId: string,
    @Query('category') category?: string,
  ): Promise<StockItem[]> {
    return this.stockService.listItems(storeId, category)
  }

  // ─── 详情 ───────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: '获取库存商品详情' })
  @ApiParam({ name: 'id', description: '库存商品 ID' })
  @ApiOkResponse({ type: StockItem })
  getById(@Param('id') id: string): Promise<StockItem> {
    return this.stockService.findItem(id)
  }

  // ─── 创建 ───────────────────────────────────────

  @Post()
  @ApiOperation({ summary: '创建库存商品' })
  @ApiOkResponse({ type: StockItem })
  create(@Body() body: Partial<StockItem>): Promise<StockItem> {
    return this.stockService.createItem(body)
  }

  // ─── 更新 ───────────────────────────────────────

  @Put(':id')
  @ApiOperation({ summary: '更新库存商品' })
  @ApiParam({ name: 'id', description: '库存商品 ID' })
  @ApiOkResponse({ type: StockItem })
  update(
    @Param('id') id: string,
    @Body() body: Partial<StockItem>,
  ): Promise<StockItem> {
    return this.stockService.updateItem(id, body)
  }

  // ─── 出入库调整 ─────────────────────────────────

  @Post(':id/adjust')
  @ApiOperation({ summary: '出入库调整', description: '入库(IN)、出库(OUT)或调整(ADJUSTMENT)库存数量' })
  @ApiParam({ name: 'id', description: '库存商品 ID' })
  @ApiOkResponse({ type: StockItem })
  adjust(
    @Param('id') id: string,
    @Body() body: { quantity: number; type: StockTransactionType; reason: string; operatorId: string },
  ): Promise<StockItem> {
    return this.stockService.adjustStock(id, body.quantity, body.type, body.reason, body.operatorId)
  }

  // ─── 交易记录 ───────────────────────────────────

  @Get(':id/transactions')
  @ApiOperation({ summary: '获取库存商品交易记录' })
  @ApiParam({ name: 'id', description: '库存商品 ID' })
  @ApiOkResponse({ type: StockTransaction, isArray: true })
  getTransactions(@Param('id') id: string): Promise<StockTransaction[]> {
    return this.stockService.getTransactions(id)
  }

  // ─── 低库存告警 ─────────────────────────────────

  @Get('low-stock')
  @ApiOperation({ summary: '低库存告警', description: '查询某门店中库存低于阈值的商品' })
  @ApiOkResponse({ type: StockItem, isArray: true })
  getLowStock(
    @Query('storeId') storeId: string,
    @Query('threshold') threshold: string,
  ): Promise<StockItem[]> {
    return this.stockService.getLowStockItems(storeId, Number(threshold))
  }
}
