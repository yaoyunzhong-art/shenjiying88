// CategoriesEntity · 商品分类数据实体
// 创建: 2026-07-22 · 从 service.ts 中独立抽取

export interface Category {
  name: string;
  description: string;
  productCount: number;
}

/** 商品分类错误码 */
export enum CategoryErrorCode {
  NOT_FOUND = 'CATEGORY_NOT_FOUND',
  DUPLICATE = 'CATEGORY_DUPLICATE',
  INVALID_NAME = 'CATEGORY_INVALID_NAME',
}

/** 商品分类错误信息 */
export class CategoryError extends Error {
  constructor(
    public readonly code: CategoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CategoryError';
  }
}

// ── seed 分类数据 ──────────────────────────────────
// 来源：从 StockItem 及实际 POS 场景中归纳
export const SEED_CATEGORIES: Category[] = [
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
