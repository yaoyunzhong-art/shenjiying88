/** 促销活动类型 */
export type PromotionType = 'discount' | 'coupon' | 'cashback' | 'gift' | 'bundle' | 'clearance';

/** 促销活动状态 */
export type PromotionStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'cancelled';

/** 促销活动项目 */
export interface PromotionItem {
  id: string;
  name: string;
  type: PromotionType;
  status: PromotionStatus;
  storeId: string;
  storeName: string;
  discountPercent?: number;
  budget: number;
  usedBudget: number;
  startAt: string;
  endAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}
