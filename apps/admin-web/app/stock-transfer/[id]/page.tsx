/**
 * 库存调拨详情页 — Stock Transfer Detail (Next.js App Router Dynamic Route)
 *
 * 功能:
 * - 展示调拨单基本信息：单号、发起方/接收方、商品明细、数量、金额
 * - 状态流转展示：待审核 → 待发货 → 运输中 → 已签收
 * - 生命周期时间线
 * - 操作按钮：审核通过 / 驳回 / 确认发货 / 确认签收
 * - 关联单据跳转
 * - 错误回退 / 加载中 / 调拨单未找到 / 搜索无结果
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import StockTransferDetailClient from '../__details__/stock-transfer-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

/** 动态生成元数据 */
async function generateStockTransferMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `库存调拨单 ${id} - M5 指挥台`,
    description: `查看库存调拨单 ${id} 的详细信息、状态流转、商品明细及操作记录。支持审核、发货、签收等流程操作。`,
  };
}

export { generateStockTransferMetadata as generateMetadata };

/** 加载占位 */
function StockTransferDetailLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      {/* 标题 + 状态 */}
      <LoadingSkeleton variant="card" rows={2} label="加载调拨单标题..." />
      <div style={{ height: 24 }} />

      {/* 基本信息 + 时间线 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <LoadingSkeleton variant="card" rows={5} label="加载基本信息" />
        <LoadingSkeleton variant="card" rows={5} label="加载状态信息" />
      </div>

      {/* 商品明细 */}
      <LoadingSkeleton variant="card" rows={4} label="加载商品明细表格..." />

      {/* 时间线 */}
      <div style={{ height: 16 }} />
      <LoadingSkeleton variant="card" rows={4} label="加载操作时间线..." />
    </div>
  );
}

/** 调拨单未找到 */
function StockTransferNotFound({ transferId }: { transferId: string }) {
  return (
    <EmptyState
      title="调拨单未找到"
      description={`调拨单 ${transferId} 不存在或已被删除。请检查单号是否正确。`}
      actionLabel="返回调拨列表"
      actionHref="/stock-transfer"
    />
  );
}

/** 错误回退 */
function StockTransferDetailErrorFallback() {
  return (
    <EmptyState
      title="调拨单数据加载异常"
      description="无法加载调拨单详情。可能原因：网络中断、后端服务不可用或调拨单数据异常。"
      actionLabel="重试"
      actionHref="/stock-transfer"
    />
  );
}

export default async function StockTransferDetailPage({ params }: PageProps) {
  const { id } = await params;

  // ID 合法性校验
  if (!id || typeof id !== 'string' || id.length < 1 || id.length > 64) {
    notFound();
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `库存调拨单 ${id}`,
            description: '门店间库存调拨单据信息管理与流程操作',
            category: 'Inventory Transfer',
          }),
        }}
      />

      {/* 主内容 */}
      <ErrorBoundary fallback={<StockTransferDetailErrorFallback />}>
        <Suspense fallback={<StockTransferDetailLoadingFallback />}>
          <StockTransferDetailClient transferId={id} />
        </Suspense>
      </ErrorBoundary>

      {/* 底部提示 */}
      <div
        style={{
          marginTop: 24,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.6,
          maxWidth: 1000,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <strong style={{ color: '#e2e8f0' }}>调拨流程说明</strong>
        <br />
        调拨单需经过：发起方提交 → 接收方审核 → 发货 → 运输 → 签收。
        运输状态由物流系统自动同步（约每 30 分钟更新一次）。
        若 48 小时内未更新，建议联系物流承运商确认。
      </div>
    </>
  );
}
