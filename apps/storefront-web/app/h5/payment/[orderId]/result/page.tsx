/**
 * h5/payment/[orderId]/result/page.tsx — 支付结果页
 * Phase-FP T-FP-027 · 2026-07-02
 */
'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MobileLayout,
  H5Card,
  H5Button,
  useH5Back,
} from '../../../../../components/h5-components';

type PaymentResultStatus = 'success' | 'failed' | 'pending';

export default function PaymentResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;
  const status = (searchParams.get('status') as PaymentResultStatus) || 'pending';
  const handleBack = useH5Back();

  return (
    <MobileLayout
      title="支付结果"
      showBack={false}
      onBack={handleBack}
      showNav={false}
    >
      {/* 结果展示 */}
      <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 32 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background:
              status === 'success'
                ? 'rgba(74, 222, 128, 0.15)'
                : status === 'failed'
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(251, 191, 36, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 40 }}>
            {status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏳'}
          </span>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#f8fafc',
            margin: '0 0 8px',
          }}
        >
          {status === 'success'
            ? '支付成功'
            : status === 'failed'
            ? '支付失败'
            : '支付处理中'}
        </h1>

        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
          {status === 'success'
            ? '感谢您的支付，订单已确认'
            : status === 'failed'
            ? '支付未完成，请稍后重试'
            : '正在等待支付结果确认'}
        </p>
      </div>

      {/* 订单信息 */}
      <H5Card style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, color: '#94a3b8' }}>订单编号</span>
          <code style={{ fontSize: 13, color: '#60a5fa' }}>{orderId}</code>
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
            {status === 'success' ? '微信支付' : '-'}
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
            {status === 'success' ? new Date().toLocaleString('zh-CN') : '-'}
          </span>
        </div>
      </H5Card>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {status === 'success' && (
          <>
            <Link href="/h5/orders" style={{ textDecoration: 'none' }}>
              <H5Button variant="primary" fullWidth>
                查看订单
              </H5Button>
            </Link>
            <Link href="/h5" style={{ textDecoration: 'none' }}>
              <H5Button variant="secondary" fullWidth>
                返回首页
              </H5Button>
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <Link href={`/h5/payment/${orderId}`} style={{ textDecoration: 'none' }}>
              <H5Button variant="primary" fullWidth>
                重新支付
              </H5Button>
            </Link>
            <Link href="/h5" style={{ textDecoration: 'none' }}>
              <H5Button variant="secondary" fullWidth>
                返回首页
              </H5Button>
            </Link>
          </>
        )}

        {status === 'pending' && (
          <>
            <H5Button variant="secondary" fullWidth onClick={handleBack}>
              返回支付页面
            </H5Button>
            <Link href="/h5" style={{ textDecoration: 'none' }}>
              <H5Button variant="ghost" fullWidth>
                先逛逛其他
              </H5Button>
            </Link>
          </>
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
    </MobileLayout>
  );
}
