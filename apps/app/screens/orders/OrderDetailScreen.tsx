import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Button } from '../../components/common/Button';
import { TriState } from '../../components/common/TriState';
import { OrderDetailItemList } from '../../components/OrderDetailItemList';
import { OrderDetailSectionBlock } from '../../components/OrderDetailSectionBlock';
import { getNativeAppOrderTransaction, type NativeAppTransactionAggregate } from '../../market-bootstrap';
import {
  buildOrderDetailBackToOrdersRouteParams,
  buildPaymentRouteParams,
  buildRefundRouteParams,
} from '../../utils/order-finance';
import type { OrderDetailRouteParams } from '../../utils/order-route';
import {
  resolveOrderDetailViewState,
} from '../../utils/order-view';
import {
  buildOrderMemberSection,
  buildOrderPaymentSection,
  buildOrderRefundSection,
  buildOrderStatusSection,
} from '../../utils/order-detail-sections';
import {
  buildOrderDetailItemRows,
} from '../../utils/order-detail-items';
import {
  buildOrderDetailFooterModel,
  getOrderDetailFooterActionStyle,
} from '../../utils/order-detail-actions';
import {
  defaultMockOrderDetail,
  resolveOrderDetailBaseOrder,
} from '../../utils/order-detail-state';

type OrderDetailParams = {
  OrderDetail: OrderDetailRouteParams;
};

export function OrderDetailScreen() {
  const fallbackNavigation = (globalThis as {
    __mockNavigation?: {
      goBack: () => void;
      navigate?: (route: string, params?: Record<string, unknown>) => void;
    };
  }).__mockNavigation ?? { goBack: () => {}, navigate: () => {} };
  const fallbackRouteParams = (globalThis as {
    __mockRoute?: OrderDetailParams['OrderDetail'];
  }).__mockRoute ?? { orderId: defaultMockOrderDetail.orderId };

  let navigation = fallbackNavigation;
  try {
    navigation = useNavigation();
  } catch {
    navigation = fallbackNavigation;
  }

  let route = { params: fallbackRouteParams } as RouteProp<OrderDetailParams, 'OrderDetail'>;
  try {
    route = useRoute<RouteProp<OrderDetailParams, 'OrderDetail'>>();
  } catch {
    route = { params: fallbackRouteParams } as RouteProp<OrderDetailParams, 'OrderDetail'>;
  }
  const routeParams = route.params && Object.keys(route.params).length > 0
    ? route.params
    : fallbackRouteParams;
  const shouldFetchAggregate = (() => {
    const globals = globalThis as {
      __mockRoute?: OrderDetailParams['OrderDetail'];
      __mockOrderFetchEnabled?: boolean;
    };
    return !globals.__mockRoute || globals.__mockOrderFetchEnabled === true;
  })();
  const [aggregate, setAggregate] = useState<NativeAppTransactionAggregate | null>(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  const [aggregateError, setAggregateError] = useState<string | null>(null);

  const fetchAggregate = useCallback(() => {
    const orderId = routeParams?.orderId;

    if (!orderId || !shouldFetchAggregate) {
      return;
    }

    setAggregateLoading(true);
    setAggregateError(null);

    getNativeAppOrderTransaction(orderId)
      .then((result) => {
        setAggregate(result);
        setAggregateLoading(false);
      })
      .catch((err: unknown) => {
        setAggregate(null);
        setAggregateError(err instanceof Error ? err.message : '订单加载失败，请重试');
        setAggregateLoading(false);
      });
  }, [routeParams?.orderId, shouldFetchAggregate]);

  useEffect(() => {
    fetchAggregate();
  }, [fetchAggregate]);
  const baseOrder = resolveOrderDetailBaseOrder(routeParams);
  const {
    order,
    effectiveRefundStatus,
    effectiveRefundAmount,
    effectiveRefundReason,
    effectiveRefundRequestedAt,
    effectiveRefundCompletedAt,
  } = resolveOrderDetailViewState(baseOrder, aggregate, routeParams);
  const hasCompletedRefund =
    effectiveRefundStatus === 'REFUNDED' &&
    typeof effectiveRefundAmount === 'number';
  const hasPendingRefund =
    effectiveRefundStatus === 'PENDING' &&
    typeof effectiveRefundAmount === 'number';
  const statusSection = buildOrderStatusSection(order);
  const refundSection = buildOrderRefundSection({
    effectiveRefundStatus,
    effectiveRefundAmount,
    effectiveRefundReason,
    effectiveRefundRequestedAt,
    effectiveRefundCompletedAt,
  });
  const paymentSection = buildOrderPaymentSection(order);
  const memberSection = buildOrderMemberSection(order);
  const footerModel = buildOrderDetailFooterModel(order);
  const itemRows = buildOrderDetailItemRows(order);

  const handleRefund = () => {
    navigation.navigate!('Refund' as never, buildRefundRouteParams({
      order,
      reason: routeParams?.refundReason,
    }) as never);
  };

  const handleConfirmPayment = () => {
    navigation.navigate!('Payment' as never, buildPaymentRouteParams({
      order,
    }) as never);
  };

  const handleBackToOrders = () => {
    const backRouteParams = buildOrderDetailBackToOrdersRouteParams({
      order,
      routeParams,
      effectiveRefundStatus,
      effectiveRefundAmount,
      effectiveRefundReason,
      effectiveRefundRequestedAt,
      effectiveRefundCompletedAt,
    });

    if (backRouteParams) {
      navigation.navigate!('Orders' as never, backRouteParams as never);
      return;
    }
    navigation.goBack();
  };

  const footerActionHandlers = {
    back: handleBackToOrders,
    pay: handleConfirmPayment,
    refund: handleRefund,
  } as const;

  return (
    <View style={styles.container}>
      <TriState
        loading={shouldFetchAggregate && aggregateLoading}
        error={shouldFetchAggregate ? aggregateError : null}
        onRetry={shouldFetchAggregate ? fetchAggregate : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <OrderDetailSectionBlock
            section={statusSection}
            containerStyle={styles.statusSection}
            cardStyle={styles.statusCard}
            titlePlacement="inside"
          />

          {refundSection && (hasPendingRefund || hasCompletedRefund) && (
            <OrderDetailSectionBlock
              section={refundSection}
              containerStyle={styles.section}
              cardStyle={styles.refundCard}
            />
          )}

          <OrderDetailItemList
            title="商品明细"
            items={itemRows}
            containerStyle={styles.section}
            cardStyle={styles.itemsCard}
          />

          <OrderDetailSectionBlock
            section={paymentSection}
            containerStyle={styles.section}
            cardStyle={styles.paymentCard}
          />

          <OrderDetailSectionBlock
            section={memberSection}
            containerStyle={styles.section}
            cardStyle={styles.memberCard}
          />
        </ScrollView>
      </TriState>

      <View style={styles.footer}>
        {footerModel.layout === 'split' ? (
          <View style={styles.footerActions}>
            {footerModel.actions.map((action) => (
              <Button
                key={action.key}
                title={action.title}
                onPress={footerActionHandlers[action.key]}
                variant={action.variant}
                style={getOrderDetailFooterActionStyle(footerModel.layout, styles)}
              />
            ))}
          </View>
        ) : footerModel.actions.map((action) => (
          <Button
            key={action.key}
            title={action.title}
            onPress={footerActionHandlers[action.key]}
            variant={action.variant}
            style={getOrderDetailFooterActionStyle(footerModel.layout, styles)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  statusSection: {
    margin: 16,
  },
  statusCard: {
    paddingVertical: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  itemsCard: {
    paddingVertical: 4,
  },
  paymentCard: {
    paddingVertical: 8,
  },
  refundCard: {
    paddingVertical: 8,
  },
  memberCard: {
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  footerActions: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  fullWidthButton: {
    flex: 1,
  },
});
