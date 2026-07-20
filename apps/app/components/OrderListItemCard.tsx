import { OrderCard } from './OrderCard';
import type { OrderSummaryViewModel } from '../utils/order-view';

interface OrderListItemCardProps {
  order: OrderSummaryViewModel;
  onPress?: () => void;
}

export function OrderListItemCard({
  order,
  onPress,
}: OrderListItemCardProps) {
  return (
    <OrderCard
      orderId={order.orderId}
      orderNo={order.orderNo}
      totalAmount={order.totalAmount}
      paidAmount={order.paidAmount}
      refundedAmount={order.refundedAmount}
      currency={order.currency}
      status={order.status}
      createdAt={order.createdAt}
      paidAt={order.paidAt}
      refundRequestedAt={order.refundRequestedAt}
      refundCompletedAt={order.refundCompletedAt}
      paymentChannel={order.paymentChannel}
      itemCount={order.itemCount}
      onPress={onPress}
    />
  );
}
