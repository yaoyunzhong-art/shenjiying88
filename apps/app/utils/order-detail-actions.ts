import type { ViewStyle } from 'react-native';
import type { Button } from '../components/common/Button';
import type { OrderDetailViewModel } from './order-view';

type ButtonVariant = Parameters<typeof Button>[0]['variant'];

export type OrderDetailFooterActionKey = 'back' | 'pay' | 'refund';
export type OrderDetailFooterLayout = 'single' | 'split';

export interface OrderDetailFooterAction {
  key: OrderDetailFooterActionKey;
  title: string;
  variant?: ButtonVariant;
}

export interface OrderDetailFooterModel {
  layout: OrderDetailFooterLayout;
  actions: OrderDetailFooterAction[];
}

export function buildOrderDetailFooterModel(
  order: Pick<OrderDetailViewModel, 'status'>,
): OrderDetailFooterModel {
  if (order.status === 'PENDING') {
    return {
      layout: 'single',
      actions: [
        {
          key: 'pay',
          title: '去收款',
        },
      ],
    };
  }

  if (order.status === 'PAID') {
    return {
      layout: 'split',
      actions: [
        {
          key: 'back',
          title: '返回',
          variant: 'outline',
        },
        {
          key: 'refund',
          title: '申请退款',
          variant: 'outline',
        },
      ],
    };
  }

  return {
    layout: 'single',
    actions: [
      {
        key: 'back',
        title: '返回',
        variant: 'outline',
      },
    ],
  };
}

export function getOrderDetailFooterActionStyle(
  layout: OrderDetailFooterLayout,
  styles: {
    footerButton: ViewStyle;
    fullWidthButton: ViewStyle;
  },
): ViewStyle {
  return layout === 'split' ? styles.footerButton : styles.fullWidthButton;
}
