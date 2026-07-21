// CategoriesService · 商品分类服务
// 创建: 2026-07-20 · 内存存储 (无数据库)

import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Category, SEED_CATEGORIES } from './categories.entity';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  private categories: Category[] = [];

  constructor() {
    this.reset();
    this.logger.log(`已加载 ${this.categories.length} 个商品分类`);
  }

  /** 重置到种子数据（测试辅助） */
  reset(): void {
    this.categories = SEED_CATEGORIES.map((c) => ({ ...c }));
  }

  /**
   * 获取全部分类列表
   */
  findAll(): Category[] {
    return this.categories.map((c) => ({ ...c }));
  }

  /**
   * 按名称精确查找分类
   * @throws NotFoundException 当分类不存在时
   */
  findByName(name: string): Category {
    const category = this.categories.find(
      (c) => c.name.toLowerCase() === decodeURIComponent(name).toLowerCase(),
    );
    if (!category) {
      throw new NotFoundException(`分类 "${name}" 不存在`);
    }
    return { ...category };
  }

  /**
   * 获取分类统计信息（含商品计数快照）
   */
  getCategoryStats(): { total: number; categories: string[] } {
    return {
      total: this.categories.length,
      categories: this.categories.map((c) => c.name),
    };
  }

  /**
   * 创建新的分类
   * @throws ConflictException 当分类名已存在时
   * @throws BadRequestException 当名称为空时
   */
  create(name: string, description: string): Category {
    const trimmedName = decodeURIComponent(name).trim();
    if (!trimmedName) {
      throw new BadRequestException('分类名称不能为空');
    }

    const exists = this.categories.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (exists) {
      throw new ConflictException(`分类 "${trimmedName}" 已存在`);
    }

    const category: Category = {
      name: trimmedName,
      description: description || '',
      productCount: 0,
    };
    this.categories.push(category);
    this.logger.log(`创建分类: "${trimmedName}"`);
    return { ...category };
  }

  /**
   * 删除分类
   * @throws NotFoundException 当分类不存在时
   */
  delete(name: string): void {
    const decodedName = decodeURIComponent(name);
    const index = this.categories.findIndex(
      (c) => c.name.toLowerCase() === decodedName.toLowerCase(),
    );
    if (index === -1) {
      throw new NotFoundException(`分类 "${decodedName}" 不存在`);
    }
    this.categories.splice(index, 1);
    this.logger.log(`删除分类: "${decodedName}"`);
  }

  /**
   * 更新分类信息（部分更新）
   * @throws NotFoundException 当分类不存在时
   */
  update(name: string, partial: Partial<Pick<Category, 'description' | 'productCount'>>): Category {
    const decodedName = decodeURIComponent(name);
    const category = this.categories.find(
      (c) => c.name.toLowerCase() === decodedName.toLowerCase(),
    );
    if (!category) {
      throw new NotFoundException(`分类 "${decodedName}" 不存在`);
    }

    if (partial.description !== undefined) {
      category.description = partial.description;
    }
    if (partial.productCount !== undefined) {
      category.productCount = partial.productCount;
    }
    this.logger.log(`更新分类: "${decodedName}"`);
    return { ...category };
  }

  /**
   * 按关键词模糊搜索分类（名称/描述包含关键词）
   */
  findByKeyword(keyword: string): Category[] {
    if (!keyword || !keyword.trim()) {
      return [];
    }
    const lower = keyword.toLowerCase();
    return this.categories
      .filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.description.toLowerCase().includes(lower),
      )
      .map((c) => ({ ...c }));
  }
}
