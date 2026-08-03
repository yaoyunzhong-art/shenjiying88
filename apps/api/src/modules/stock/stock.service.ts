// StockService · Phase-17 T1
// 创建: 2026-07-18 · 库存管理模块
// 状态: IMPLEMENTED · 出入库/库存告警/事务性更新

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual } from 'typeorm';
import { StockItem, StockItemStatus } from './stock-item.entity';
import { StockTransaction, StockTransactionType } from './stock-transaction.entity';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectRepository(StockItem)
    private readonly stockItemRepo: Repository<StockItem>,

    @InjectRepository(StockTransaction)
    private readonly stockTxnRepo: Repository<StockTransaction>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * 创建库存项
   * @throws BadRequestException 当 name/sku/storeId 为空或 price <= 0
   */
  async createItem(dto: Partial<StockItem>): Promise<StockItem> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('库存商品名称不能为空');
    }
    if (!dto.sku || !dto.sku.trim()) {
      throw new BadRequestException('库存商品 SKU 不能为空');
    }
    if (!dto.storeId || !dto.storeId.trim()) {
      throw new BadRequestException('门店 ID 不能为空');
    }
    if (dto.price !== undefined && dto.price <= 0) {
      throw new BadRequestException('价格必须大于 0');
    }

    const item = this.stockItemRepo.create({
      name: dto.name.trim(),
      sku: dto.sku.trim(),
      storeId: dto.storeId.trim(),
      category: dto.category?.trim() ?? null,
      quantity: dto.quantity ?? 0,
      price: dto.price ?? 0,
      status: dto.status ?? StockItemStatus.ACTIVE,
    });

    return this.stockItemRepo.save(item);
  }

  /**
   * 更新库存项
   * @throws NotFoundException 当库存项不存在
   * @throws BadRequestException 当更新字段无效
   */
  async updateItem(id: string, dto: Partial<StockItem>): Promise<StockItem> {
    const item = await this.stockItemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`库存项 ${id} 不存在`);
    }

    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new BadRequestException('库存商品名称不能为空');
      }
      item.name = dto.name.trim();
    }
    if (dto.sku !== undefined) {
      if (!dto.sku.trim()) {
        throw new BadRequestException('库存商品 SKU 不能为空');
      }
      item.sku = dto.sku.trim();
    }
    if (dto.category !== undefined) {
      item.category = dto.category?.trim() ?? null;
    }
    if (dto.price !== undefined) {
      if (dto.price <= 0) {
        throw new BadRequestException('价格必须大于 0');
      }
      item.price = dto.price;
    }
    if (dto.status !== undefined) {
      item.status = dto.status;
    }

    return this.stockItemRepo.save(item);
  }

  /**
   * 根据 ID 查找库存项
   * @throws NotFoundException 当库存项不存在
   */
  async findItem(id: string): Promise<StockItem> {
    const item = await this.stockItemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`库存项 ${id} 不存在`);
    }
    return item;
  }

  /**
   * 查询某门店的库存列表，可选按品类筛选
   */
  async listItems(storeId: string, category?: string): Promise<StockItem[]> {
    const where: any = { storeId };
    if (category) {
      where.category = category;
    }
    return this.stockItemRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 出入库操作（事务性）
   *
   * 更新 StockItem.quantity 并创建 StockTransaction 记录。
   * 出入库后数量不可为负数。
   *
   * @param itemId   库存项 ID
   * @param quantity 变动数量（IN > 0, OUT < 0, ADJUSTMENT 可正可负）
   * @param type     交易类型
   * @param reason   原因说明
   * @param operatorId 操作人 ID
   *
   * @throws NotFoundException     库存项不存在
   * @throws BadRequestException   数量为 0 / 出库导致库存不足 / 类型与数量符号不匹配
   */
  async adjustStock(
    itemId: string,
    quantity: number,
    type: StockTransactionType,
    reason: string,
    operatorId: string,
  ): Promise<StockItem> {
    // 参数校验
    if (quantity === 0) {
      throw new BadRequestException('变动数量不能为 0');
    }

    // 类型与数量符号校验
    if (type === StockTransactionType.IN && quantity < 0) {
      throw new BadRequestException('入库操作的变动数量必须为正数');
    }
    if (type === StockTransactionType.OUT && quantity > 0) {
      throw new BadRequestException('出库操作的变动数量必须为负数');
    }

    if (!reason || !reason.trim()) {
      throw new BadRequestException('出入库原因不能为空');
    }
    if (!operatorId || !operatorId.trim()) {
      throw new BadRequestException('操作人 ID 不能为空');
    }

    // 在事务中执行库存更新 + 交易记录写入
    const updated = await this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(StockItem);
      const txnRepo = manager.getRepository(StockTransaction);

      const item = await itemRepo.findOne({ where: { id: itemId } });
      if (!item) {
        throw new NotFoundException(`库存项 ${itemId} 不存在`);
      }

      const newQuantity = item.quantity + quantity;

      // 出库或负向调整时，库存不能为负数
      if (newQuantity < 0) {
        throw new BadRequestException(
          `库存不足：当前库存 ${item.quantity}，${type === StockTransactionType.OUT ? '出库' : '调整'}数量 ${Math.abs(quantity)} 后库存将变为负数`,
        );
      }

      // 乐观锁更新：用当前数量作为条件防止并发覆盖
      const updateResult = await itemRepo.update(
        { id: itemId, quantity: item.quantity },
        { quantity: newQuantity },
      );

      if (updateResult.affected === 0) {
        throw new BadRequestException('库存更新冲突，请重试');
      }

      // 创建交易记录
      const txn = txnRepo.create({
        stockItemId: itemId,
        type,
        quantity,
        reason: reason.trim(),
        operatorId: operatorId.trim(),
        storeId: item.storeId,
      });
      await txnRepo.save(txn);

      this.logger.log(
        `Stock ${type === StockTransactionType.IN ? '入库' : type === StockTransactionType.OUT ? '出库' : '调整'}: item=${itemId} qty=${quantity > 0 ? '+' : ''}${quantity} -> ${newQuantity} operator=${operatorId}`,
      );

      // 返回更新后的库存项
      return itemRepo.findOne({ where: { id: itemId } });
    });

    return updated!;
  }

  /**
   * 获取某库存项的所有交易记录（按时间倒序）
   */
  async getTransactions(itemId: string): Promise<StockTransaction[]> {
    // 先确认库存项存在
    const item = await this.stockItemRepo.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`库存项 ${itemId} 不存在`);
    }

    return this.stockTxnRepo.find({
      where: { stockItemId: itemId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 库存告警：查询某门店中库存低于阈值的商品
   */
  async getLowStockItems(storeId: string, threshold: number): Promise<StockItem[]> {
    if (!storeId || !storeId.trim()) {
      throw new BadRequestException('门店 ID 不能为空');
    }
    if (threshold < 0) {
      throw new BadRequestException('告警阈值不能为负数');
    }

    return this.stockItemRepo.find({
      where: {
        storeId,
        quantity: LessThanOrEqual(threshold),
        status: StockItemStatus.ACTIVE,
      },
      order: { quantity: 'ASC' },
    });
  }
}
