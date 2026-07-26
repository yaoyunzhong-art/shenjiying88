'use client';

import React, { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@m5/ui';
import {
  PO_STATUS_LABELS,
  CHECK_STATUS_LABELS,
  TRANSFER_STATUS_LABELS,
  TRANSFER_TYPE_LABELS,
  formatCurrency,
  formatDate,
  type Product,
  type PurchaseOrder,
  type InventoryCheck,
  type CrossStoreTransfer,
} from './inventory-data';
import {
  receivePO,
  approveTransfer,
  executeTransfer,
  receiveTransfer,
} from './inventory-service';
import type { InventoryPageSnapshot } from './inventory-page-data';

type Tab = 'products' | 'purchase-orders' | 'inventory-checks' | 'transfers';

const STOCK_STATUS_COLORS: Record<string, string> = {
  normal: '#22c55e',
  low: '#f59e0b',
  out: '#ef4444',
};

const STOCK_STATUS_LABELS: Record<string, string> = {
  normal: '正常',
  low: '库存不足',
  out: '已售罄',
};

export default function InventoryClient({
  snapshot,
}: {
  snapshot: InventoryPageSnapshot;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', brand: '', unit: '' });
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  const refreshSnapshot = useCallback(() => {
    startRefresh(() => {
      router.refresh();
    });
  }, [router]);

  const runInventoryAction = useCallback(
    async (actionKey: string, action: () => Promise<unknown>) => {
      setPendingAction(actionKey);
      try {
        await action();
        refreshSnapshot();
      } finally {
        setPendingAction((current) => (current === actionKey ? null : current));
      }
    },
    [refreshSnapshot],
  );

  async function handleReceivePO(poId: string) {
    const po = snapshot.purchaseOrders.find((item) => item.poId === poId);
    if (!po) return;
    const items = po.items.map((item) => ({
      skuId: item.skuId,
      quantity: item.quantity - item.receivedQuantity,
    }));
    await runInventoryAction(`po:${poId}`, () => receivePO(poId, items));
  }

  async function handleApproveTransfer(id: string) {
    await runInventoryAction(`transfer-approve:${id}`, () => approveTransfer(id));
  }

  async function handleExecuteTransfer(id: string) {
    await runInventoryAction(`transfer-execute:${id}`, () => executeTransfer(id));
  }

  async function handleReceiveTransfer(id: string) {
    await runInventoryAction(`transfer-receive:${id}`, () => receiveTransfer(id));
  }

  function getPOStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: '#94a3b8',
      pending: '#f59e0b',
      approved: '#3b82f6',
      received: '#22c55e',
      cancelled: '#ef4444',
    };
    return colors[status] ?? '#94a3b8';
  }

  function getTransferStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: '#94a3b8',
      pending: '#f59e0b',
      approved: '#3b82f6',
      in_transit: '#8b5cf6',
      completed: '#22c55e',
      cancelled: '#ef4444',
    };
    return colors[status] ?? '#94a3b8';
  }

  const isBusy = isRefreshing || pendingAction !== null;

  return (
    <PageShell title="进销存管理" description="商品管理、采购订单、库存盘点、跨店调拨">
      <div style={{ padding: '0 32px 32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
            服务端快照已透传到客户端渲染层，所有刷新统一走 `router.refresh()`。
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => router.push('/inventory/rules')}
              style={secondaryButtonStyle}
            >
              库存规则
            </button>
            <button
              type="button"
              onClick={refreshSnapshot}
              disabled={isBusy}
              style={{
                ...secondaryButtonStyle,
                cursor: isBusy ? 'not-allowed' : 'pointer',
                opacity: isBusy ? 0.65 : 1,
              }}
            >
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
          </div>
        </div>

        {snapshot.error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(250,204,21,0.28)',
              background: 'rgba(250,204,21,0.08)',
              color: '#fde68a',
            }}
          >
            {snapshot.error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            borderBottom: '1px solid rgba(148,163,184,0.2)',
            paddingBottom: 12,
          }}
        >
          {(['products', 'purchase-orders', 'inventory-checks', 'transfers'] as Tab[]).map((tab) => {
            const labels: Record<Tab, string> = {
              products: '商品管理',
              'purchase-orders': '采购订单',
              'inventory-checks': '库存盘点',
              transfers: '跨店调拨',
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    activeTab === tab
                      ? 'linear-gradient(135deg, #3b82f6, #60a5fa)'
                      : 'rgba(148,163,184,0.1)',
                  color: activeTab === tab ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.2s ease',
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {activeTab === 'products' && (
          <div>
            {snapshot.storeStats.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {snapshot.storeStats.map((stat) => (
                  <div
                    key={stat.storeId}
                    style={{
                      padding: 16,
                      background: 'rgba(30,41,59,0.9)',
                      border: '1px solid rgba(148,163,184,0.12)',
                      borderRadius: 10,
                    }}
                  >
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px' }}>{stat.storeName}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
                      {stat.totalStock}
                    </p>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ color: '#94a3b8' }}>SKU {stat.totalSKUs}</span>
                      {stat.lowStockAlerts > 0 && <span style={{ color: '#f59e0b' }}>预警 {stat.lowStockAlerts}</span>}
                      {stat.outOfStock > 0 && <span style={{ color: '#ef4444' }}>缺货 {stat.outOfStock}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setShowProductForm(!showProductForm)}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
                }}
              >
                {showProductForm ? '取消新增' : '+ 新增商品'}
              </button>
            </div>

            {showProductForm && (
              <div
                style={{
                  padding: 20,
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 10,
                  marginBottom: 20,
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
                  新增商品
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <input
                    placeholder="商品名称"
                    value={newProduct.name}
                    onChange={(event) => setNewProduct((current) => ({ ...current, name: event.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="品类"
                    value={newProduct.category}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, category: event.target.value }))
                    }
                    style={inputStyle}
                  />
                  <input
                    placeholder="品牌"
                    value={newProduct.brand}
                    onChange={(event) => setNewProduct((current) => ({ ...current, brand: event.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="单位"
                    value={newProduct.unit}
                    onChange={(event) => setNewProduct((current) => ({ ...current, unit: event.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '12px 0 0' }}>
                  表单已简化，当前 fallback 样本态仅用于结构演示。
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {snapshot.products.map((product: Product) => {
                const skus = snapshot.skuMap[product.productId] ?? [];
                const totalStock = skus.reduce((sum, sku) => sum + sku.stock, 0);
                const stockStatus =
                  totalStock === 0 ? 'out' : skus.some((sku) => sku.stock < sku.safetyStock) ? 'low' : 'normal';
                return (
                  <div
                    key={product.productId}
                    style={{
                      padding: 16,
                      background: 'rgba(30,41,59,0.9)',
                      border: '1px solid rgba(148,163,184,0.12)',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>
                          {product.name}
                        </p>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                          {product.category} | {product.brand} | {product.unit}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 4,
                            background: STOCK_STATUS_COLORS[stockStatus],
                            color: stockStatus === 'out' ? '#ffffff' : '#0f172a',
                          }}
                        >
                          {STOCK_STATUS_LABELS[stockStatus]}
                        </span>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0' }}>
                          SKU {skus.length} | 库存 {totalStock}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'purchase-orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {snapshot.purchaseOrders.map((po: PurchaseOrder) => {
              const actionKey = `po:${po.poId}`;
              const actionPending = pendingAction === actionKey;
              return (
                <div
                  key={po.poId}
                  style={{
                    padding: 18,
                    background: 'rgba(30,41,59,0.9)',
                    border: '1px solid rgba(148,163,184,0.12)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 2px' }}>{po.poNo}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{po.supplierName}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 4,
                          background: getPOStatusColor(po.status),
                          color: po.status === 'draft' || po.status === 'cancelled' ? '#ffffff' : '#0f172a',
                        }}
                      >
                        {PO_STATUS_LABELS[po.status]}
                      </span>
                      {po.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleReceivePO(po.poId)}
                          disabled={actionPending || isRefreshing}
                          style={{
                            ...actionButtonStyle('#22c55e'),
                            opacity: actionPending || isRefreshing ? 0.65 : 1,
                            cursor: actionPending || isRefreshing ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {actionPending ? '处理中...' : '确认收货'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8' }}>
                    <span>申请时间: {formatDate(po.appliedAt)}</span>
                    <span>总金额: {formatCurrency(po.totalAmount)}</span>
                    <span>明细 {po.items.length} 项</span>
                  </div>
                  <div style={{ marginTop: 8, borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 8 }}>
                    {po.items.map((item) => (
                      <div
                        key={item.itemId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: '#e2e8f0',
                          marginBottom: 4,
                        }}
                      >
                        <span>{item.skuName}</span>
                        <span style={{ color: '#94a3b8' }}>
                          {item.receivedQuantity}/{item.quantity} {formatCurrency(item.unitCost)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'inventory-checks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {snapshot.inventoryChecks.map((check: InventoryCheck) => (
              <div
                key={check.checkId}
                style={{
                  padding: 18,
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 2px' }}>{check.checkNo}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{check.storeName}</p>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 4,
                      background:
                        check.status === 'completed'
                          ? '#22c55e'
                          : check.status === 'in_progress'
                            ? '#f59e0b'
                            : '#94a3b8',
                      color: '#0f172a',
                    }}
                  >
                    {CHECK_STATUS_LABELS[check.status]}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                  {check.completedAt
                    ? `完成时间: ${formatDate(check.completedAt)}`
                    : `盘点时间: ${formatDate(check.checkedAt ?? '')}`}
                </div>
                <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 8 }}>
                  {check.items.map((item) => (
                    <div
                      key={item.itemId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        marginBottom: 4,
                        padding: item.difference !== 0 ? '4px 8px' : undefined,
                        background: item.difference !== 0 ? 'rgba(239,68,68,0.1)' : undefined,
                        borderRadius: item.difference !== 0 ? 4 : undefined,
                      }}
                    >
                      <span style={{ color: '#e2e8f0' }}>{item.skuName}</span>
                      <span style={{ color: '#94a3b8' }}>
                        账面 {item.bookStock} | 实际 {item.actualStock}
                        {item.difference !== 0 && (
                          <span style={{ color: '#ef4444', marginLeft: 8, fontWeight: 600 }}>
                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'transfers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {snapshot.transfers.map((transfer: CrossStoreTransfer) => {
              const approveKey = `transfer-approve:${transfer.transferId}`;
              const executeKey = `transfer-execute:${transfer.transferId}`;
              const receiveKey = `transfer-receive:${transfer.transferId}`;
              return (
                <div
                  key={transfer.transferId}
                  style={{
                    padding: 18,
                    background: 'rgba(30,41,59,0.9)',
                    border: '1px solid rgba(148,163,184,0.12)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 2px' }}>
                        {transfer.transferNo}{' '}
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>
                          ({TRANSFER_TYPE_LABELS[transfer.type]})
                        </span>
                      </p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                        {transfer.fromStore} → {transfer.toStore}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 4,
                          background: getTransferStatusColor(transfer.status),
                          color: ['draft', 'pending', 'cancelled'].includes(transfer.status) ? '#ffffff' : '#0f172a',
                        }}
                      >
                        {TRANSFER_STATUS_LABELS[transfer.status]}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {transfer.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleApproveTransfer(transfer.transferId)}
                            disabled={pendingAction === approveKey || isRefreshing}
                            style={{
                              ...actionButtonStyle('#3b82f6'),
                              opacity: pendingAction === approveKey || isRefreshing ? 0.65 : 1,
                              cursor: pendingAction === approveKey || isRefreshing ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {pendingAction === approveKey ? '处理中...' : '审批'}
                          </button>
                        )}
                        {transfer.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleExecuteTransfer(transfer.transferId)}
                            disabled={pendingAction === executeKey || isRefreshing}
                            style={{
                              ...actionButtonStyle('#8b5cf6'),
                              opacity: pendingAction === executeKey || isRefreshing ? 0.65 : 1,
                              cursor: pendingAction === executeKey || isRefreshing ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {pendingAction === executeKey ? '处理中...' : '执行'}
                          </button>
                        )}
                        {transfer.status === 'in_transit' && (
                          <button
                            type="button"
                            onClick={() => handleReceiveTransfer(transfer.transferId)}
                            disabled={pendingAction === receiveKey || isRefreshing}
                            style={{
                              ...actionButtonStyle('#22c55e'),
                              opacity: pendingAction === receiveKey || isRefreshing ? 0.65 : 1,
                              cursor: pendingAction === receiveKey || isRefreshing ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {pendingAction === receiveKey ? '处理中...' : '接收'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                    <span>申请人: {transfer.applicant}</span>
                    {transfer.approver && <span>审批人: {transfer.approver}</span>}
                    <span>调拨成本: {formatCurrency(transfer.totalCost)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 8 }}>
                    {transfer.items.map((item) => (
                      <div
                        key={item.itemId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: '#e2e8f0',
                          marginBottom: 4,
                        }}
                      >
                        <span>{item.skuName}</span>
                        <span style={{ color: '#94a3b8' }}>
                          ×{item.quantity} {formatCurrency(item.costPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 14,
  borderRadius: 6,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15,23,42,0.8)',
  color: '#e2e8f0',
  outline: 'none',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.24)',
  background: 'rgba(15,23,42,0.55)',
  color: '#e2e8f0',
};

function actionButtonStyle(color: string): React.CSSProperties {
  return {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 4,
    border: 'none',
    background: color,
    color: '#ffffff',
  };
}
