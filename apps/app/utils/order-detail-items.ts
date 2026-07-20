import {
  formatOrderCurrencyAmount,
} from './order-display';
import type { OrderDetailViewModel } from './order-view';

export interface OrderDetailItemRow {
  key: string;
  title: string;
  skuLabel: string;
  priceLabel: string;
  quantityLabel: string;
  showDivider: boolean;
}

export function buildOrderDetailItemRows(
  order: Pick<OrderDetailViewModel, 'items' | 'currency'>,
): OrderDetailItemRow[] {
  return order.items.map((item, index) => ({
    key: item.skuId,
    title: item.title,
    skuLabel: `SKU: ${item.skuId}`,
    priceLabel: formatOrderCurrencyAmount(item.price, order.currency),
    quantityLabel: `x${item.quantity}`,
    showDivider: index < order.items.length - 1,
  }));
}
