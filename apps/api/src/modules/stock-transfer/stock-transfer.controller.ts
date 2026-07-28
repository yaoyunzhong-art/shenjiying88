import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common'
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ArrayMinSize, ValidateNested, MinLength } from 'class-validator'
import { Type } from 'class-transformer'
import { TrafficGovernanceGuard } from '../../common/guards/traffic-governance.guard'
import { StockTransferService, type TransferStatus, type TransferType } from './stock-transfer.service'
import type { StockTransfer, StockTransferItem } from './stock-transfer.service'

// ── DTO ─────────────────────────────────────────────────────────────────────

class StockTransferItemDto { @IsString() @IsNotEmpty() productId!: string; @IsString() productName!: string; @IsString() sku!: string; @IsNotEmpty() quantity!: number; @IsString() unit!: string }
class CreateTransferDto { @IsString() tenantId!: string; @IsEnum(['store_to_store','warehouse_to_store','store_to_warehouse','warehouse_to_warehouse']) transferType!: TransferType; @IsString() fromLocationId!: string; @IsString() fromLocationName!: string; @IsString() toLocationId!: string; @IsString() toLocationName!: string; @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => StockTransferItemDto) items!: StockTransferItemDto[]; @IsString() requestedById!: string; @IsOptional() @IsString() notes?: string }
class ApproveDto { @IsString() approvedById!: string }
class ReceiveDto { @IsString() receivedById!: string }
class ListQuery { @IsOptional() @IsString() status?: TransferStatus; @IsOptional() @IsString() tenantId?: string; @IsOptional() @IsString() fromLocationId?: string; @IsOptional() @IsString() toLocationId?: string }

@Controller('stock-transfer')
@UseGuards(TrafficGovernanceGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class StockTransferController {
  constructor(private readonly service: StockTransferService) {}

  @Post()
  create(@Body() dto: CreateTransferDto): Promise<StockTransfer> { return this.service.create(dto) }

  @Get()
  list(@Query() q: ListQuery): Promise<StockTransfer[]> { return this.service.list(q) }

  @Get('stats/:tenantId')
  getStats(@Param('tenantId') tid: string) { return this.service.getStats(tid) }

  @Get(':id')
  getById(@Param('id') id: string): Promise<StockTransfer> { return this.service.getById(id) }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() d: ApproveDto): Promise<StockTransfer> { return this.service.approve(id, d.approvedById) }

  @Patch(':id/in-transit')
  startTransit(@Param('id') id: string): Promise<StockTransfer> { return this.service.startTransit(id) }

  @Patch(':id/receive')
  receive(@Param('id') id: string, @Body() d: ReceiveDto): Promise<StockTransfer> { return this.service.receive(id, d.receivedById) }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string): Promise<StockTransfer> { return this.service.cancel(id) }

  @Patch(':id/reject')
  reject(@Param('id') id: string): Promise<StockTransfer> { return this.service.reject(id) }
}
