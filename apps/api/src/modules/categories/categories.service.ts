// CategoriesService · 商品分类服务
// 创建: 2026-07-20 · 内存存储 (无数据库)

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

export interface Category {
  name: string;
  description: string;
  productCount: number;
}

// ── seed 分类数据 ──────────────────────────────────
// 来源：从 StockItem 及实际 POS 场景中归纳
const SEED_CATEGORIES: Category[] = [
  { name: '餐饮', description: '食品、饮料、熟食及原料', productCount: 0 },
  { name: '服装', description: '服饰、鞋帽、配饰', productCount: 0 },
  { name: '数码', description: '电子产品、手机、电脑及配件', productCount: 0 },
  { name: '日用品', description: '家庭清洁、个人护理、日常消耗品', productCount: 0 },
  { name: '娱乐', description: '玩具、游戏、文体用品', productCount: 0 },
  { name: '饮品', description: '瓶装饮料、茶饮、咖啡、酒水', productCount: 0 },
  { name: '零食', description: '休闲零食、糖果、糕点点心', productCount: 0 },
  { name: '文具', description: '办公用品、文具、纸张', productCount: 0 },
  { name: '医疗', description: '药品、医疗器械、保健品', productCount: 0 },
  { name: '其他', description: '未分类或其他商品', productCount: 0 },
];

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  private categories: Category[] = [];

  constructor() {
    this.categories = [...SEED_CATEGORIES];
    this.logger.log(`已加载 ${this.categories.length} 个商品分类`);
  }

  /**
   * 获取全部分类列表
   */
  findAll(): Category[] {
    return [...this.categories];
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
}
