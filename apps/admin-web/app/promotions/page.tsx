import type { Metadata } from 'next';
import { getPromotions } from './promotions-data';
import { PromotionListClient } from './promotion-list-client';

export const metadata: Metadata = {
  title: '促销活动管理 - M5 指挥台',
  description: '管理门店促销活动，支持折扣、优惠券、返现等多种活动类型',
};

export default function PromotionsPage() {
  const promotions = getPromotions();
  return <PromotionListClient promotions={promotions} />;
}
