/**
 * h5/payment/[orderId]/result/page.tsx — 支付结果页
 * Phase-FP T-FP-027 · 2026-07-02
 */
'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MobileLayout,
  H5Button,
  useH5Back,
} from '../../../../../components/h5-components';
import { useTriState } from '../../../../_components/useTriState';
import { TriStateRenderer } from '../../../../_components/TriStateRenderer';
import {
  RESULT_DISPLAY,
  formatCurrency,
  getPaymentMethodLabel,
  getPaymentResultActions,
  getStorefrontOrderTransaction,
  mapAggregateToResultStatus,
  type StorefrontTransactionAggregate,
} from '../../../../../lib/storefront-transactions';

export default function PaymentResultPage() {
  const [ready, setReady] = useState(false);
  const [aggregate, setAggregate] = useState<StorefrontTransactionAggregate | null>(null);
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const params = useParams();
  const orderId = params.orderId as string;
  const handleBack = useH5Back();

  React.useEffect(() => {
    wrapLoad(getStorefrontOrderTransaction(orderId)).then((result) => {
      setAggregate(result);
      setReady(true);
    });
  }, [orderId, wrapLoad]);

  const status = aggregate ? mapAggregateToResultStatus(aggregate) : 'pending';
  const display = RESULT_DISPLAY[status];
  const actions = getPaymentResultActions(status, orderId);

  return (
    <MobileLayout
      title="支付结果"
      showBack={false}
      onBack={handleBack}
      showNav={false}
    >
      <TriStateRenderer
        loading={loading}
        empty={!aggregate && !loading && !error}
        error={error}
        onRetry={() =>
          wrapLoad(getStorefrontOrderTransaction(orderId)).then((result) => {
            setAggregate(result);
            setReady(true);
          })
        }
      >
      {/* 结果展示 */}
      <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 32 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: display.bgColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 40 }}>{display.icon}</span>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#f8fafc',
            margin: '0 0 8px',
          }}
        >
          {display.title}
        </h1>

        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
          {display.subtitle}
        </p>
      </div>

      {/* 订单信息 */}
      <div
        style={{
          marginBottom: 20,
          padding: 18,
          borderRadius: 16,
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(148, 163, 184, 0.16)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, color: '#94a3b8' }}>订单编号</span>
          <code style={{ fontSize: 13, color: '#60a5fa' }}>{aggregate?.order.orderNo ?? orderId}</code>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, color: '#94a3b8' }}>支付方式</span>
          <span style={{ fontSize: 13, color: '#e2e8f0' }}>
            {getPaymentMethodLabel(aggregate?.payment?.channel)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, color: '#94a3b8' }}>支付时间</span>
          <span style={{ fontSize: 13, color: '#e2e8f0' }}>
            {aggregate?.payment?.completedAt
              ? new Date(aggregate.payment.completedAt).toLocaleString('zh-CN')
              : aggregate?.order.paidAt
                ? new Date(aggregate.order.paidAt).toLocaleString('zh-CN')
                : '-'}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(148, 163, 184, 0.12)',
          }}
        >
          <span style={{ fontSize: 13, color: '#94a3b8' }}>支付金额</span>
          <span style={{ fontSize: 14, color: '#f8fafc', fontWeight: 600 }}>
            {formatCurrency(aggregate?.payment?.amount ?? aggregate?.order.totalAmount ?? 0, aggregate?.order.currency)}
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {actions.map((action) =>
          action.action === 'back' ? (
            <H5Button key={action.label} variant={action.variant} fullWidth onClick={handleBack}>
              {action.label}
            </H5Button>
          ) : (
            <Link key={action.label} href={action.href ?? '/h5'} style={{ textDecoration: 'none' }}>
              <H5Button variant={action.variant} fullWidth>
                {action.label}
              </H5Button>
            </Link>
          ),
        )}
      </div>

      {/* 帮助信息 */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
          支付遇到问题？
        </p>
        <Link
          href="/h5/contact"
          style={{ fontSize: 13, color: '#667eea', textDecoration: 'none' }}
        >
          联系客服
        </Link>
      </div>
      </TriStateRenderer>
    </MobileLayout>
  );
}
