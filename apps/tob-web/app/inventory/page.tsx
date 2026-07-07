'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '@m5/ui';
import {
  MOCK_PRODUCTS,
  MOCK_SKUS,
  MOCK_PURCHASE_ORDERS,
  MOCK_INVENTORY_CHECKS,
  MOCK_TRANSFERS,
  PO_STATUS_LABELS,
  CHECK_STATUS_LABELS,
  TRANSFER_STATUS_LABELS,
  TRANSFER_TYPE_LABELS,
  formatCurrency,
  formatDate,
  getSKUStockStatus,
  type Product,
  type SKU,
  type PurchaseOrder,
  type InventoryCheck,
  type CrossStoreTransfer,
} from './inventory-data';
import {
  getProducts,
  getSKUs,
  getPurchaseOrders,
  receivePO,
  getInventoryChecks,
  getTransfers,
  approveTransfer,
  executeTransfer,
  receiveTransfer,
  getStoreStats,
} from './inventory-service';
import type { StoreStats } from './inventory-data';

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

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [skuMap, setSkuMap] = useState<Record<string, SKU[]>>({});
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
  const [inventoryChecks, setInventoryChecks] = useState<InventoryCheck[]>(MOCK_INVENTORY_CHECKS);
  const [transfers, setTransfers] = useState<CrossStoreTransfer[]>(MOCK_TRANSFERS);
  const [storeStats, setStoreStats] = useState<StoreStats[]>([]);
  const [loading, setLoading] = useState(false);

  // New product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', brand: '', unit: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [prods, orders, checks, trans, stats] = await Promise.all([
        getProducts(),
        getPurchaseOrders(),
        getInventoryChecks(),
        getTransfers(),
        getStoreStats(),
      ]);
      setProducts(prods);
      setPurchaseOrders(orders);
      setInventoryChecks(checks);
      setTransfers(trans);
      setStoreStats(stats);

      // Load SKUs per product
      const skuResult: Record<string, SKU[]> = {};
      for (const p of prods) {
        skuResult[p.productId] = await getSKUs(p.productId);
      }
      setSkuMap(skuResult);
    } finally {
      setLoading(false);
    }
  }

  async function handleReceivePO(poId: string) {
    const po = purchaseOrders.find(p => p.poId === poId);
    if (!po) return;
    const items = po.items.map(i => ({ skuId: i.skuId, quantity: i.quantity - i.receivedQuantity }));
    await receivePO(poId, items);
    await loadData();
  }

  async function handleApproveTransfer(id: string) {
    await approveTransfer(id);
    await loadData();
  }

  async function handleExecuteTransfer(id: string) {
    await executeTransfer(id);
    await loadData();
  }

  async function handleReceiveTransfer(id: string) {
    await receiveTransfer(id);
    await loadData();
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

  return (
    <PageShell title="进销存管理" description="商品管理、采购订单、库存盘点、跨店调拨">
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: 12 }}>
        {(['products', 'purchase-orders', 'inventory-checks', 'transfers'] as Tab[]).map(tab => {
          const labels: Record<Tab, string> = {
            'products': '商品管理',
            'purchase-orders': '采购订单',
            'inventory-checks': '库存盘点',
            'transfers': '跨店调拨',
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'rgba(148,163,184,0.1)',
                color: activeTab === tab ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s ease',
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ===================== 商品管理 ===================== */}
      {activeTab === 'products' && (
        <div>
          {/* Store Stats Summary */}
          {storeStats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              {storeStats.map(stat => (
                <div key={stat.storeId} style={{
                  padding: 16,
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 10,
                }}>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px' }}>{stat.storeName}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>{stat.totalStock}</p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>SKU {stat.totalSKUs}</span>
                    {stat.lowStockAlerts > 0 && <span style={{ color: '#f59e0b' }}>预警 {stat.lowStockAlerts}</span>}
                    {stat.outOfStock > 0 && <span style={{ color: '#ef4444' }}>缺货 {stat.outOfStock}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Product Button */}
          <div style={{ marginBottom: 16 }}>
            <button
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

          {/* New Product Form */}
          {showProductForm && (
            <div style={{
              padding: 20,
              background: 'rgba(30,41,59,0.9)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 10,
              marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>新增商品</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <input
                  placeholder="商品名称"
                  value={newProduct.name}
                  onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  placeholder="品类"
                  value={newProduct.category}
                  onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  placeholder="品牌"
                  value={newProduct.brand}
                  onChange={e => setNewProduct(p => ({ ...p, brand: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  placeholder="单位"
                  value={newProduct.unit}
                  onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '12px 0 0' }}>表单已简化，实际系统请添加 SKU 等完整信息</p>
            </div>
          )}

          {/* Product List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {products.map(product => {
              const skus = skuMap[product.productId] ?? [];
              const totalStock = skus.reduce((sum, s) => sum + s.stock, 0);
              const stockStatus = totalStock === 0 ? 'out' : skus.some(s => s.stock < s.safetyStock) ? 'low' : 'normal';
              return (
                <div key={product.productId} style={{
                  padding: 16,
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 10,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>{product.name}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                        {product.category} | {product.brand} | {product.unit}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 4,
                        background: STOCK_STATUS_COLORS[stockStatus],
                        color: stockStatus === 'out' ? '#ffffff' : '#0f172a',
                      }}>
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

      {/* ===================== 采购订单 ===================== */}
      {activeTab === 'purchase-orders' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {purchaseOrders.map(po => (
              <div key={po.poId} style={{
                padding: 18,
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 2px' }}>{po.poNo}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{po.supplierName}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: getPOStatusColor(po.status),
                      color: po.status === 'draft' || po.status === 'cancelled' ? '#ffffff' : '#0f172a',
                    }}>
                      {PO_STATUS_LABELS[po.status]}
                    </span>
                    {po.status === 'approved' && (
                      <button
                        onClick={() => handleReceivePO(po.poId)}
                        style={{
                          padding: '6px 14px',
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 4,
                          border: 'none',
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          color: '#ffffff',
                        }}
                      >
                        确认收货
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
                  {po.items.map(item => (
                    <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#e2e8f0', marginBottom: 4 }}>
                      <span>{item.skuName}</span>
                      <span style={{ color: '#94a3b8' }}>
                        {item.receivedQuantity}/{item.quantity} {formatCurrency(item.unitCost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 库存盘点 ===================== */}
      {activeTab === 'inventory-checks' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {inventoryChecks.map(check => (
              <div key={check.checkId} style={{
                padding: 18,
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 2px' }}>{check.checkNo}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{check.storeName}</p>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: check.status === 'completed' ? '#22c55e' : check.status === 'in_progress' ? '#f59e0b' : '#94a3b8',
                    color: '#0f172a',
                  }}>
                    {CHECK_STATUS_LABELS[check.status]}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                  {check.completedAt ? `完成时间: ${formatDate(check.completedAt)}` : `盘点时间: ${formatDate(check.checkedAt ?? '')}`}
                </div>
                <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 8 }}>
                  {check.items.map(item => (
                    <div key={item.itemId} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      marginBottom: 4,
                      padding: item.difference !== 0 ? '4px 8px' : undefined,
                      background: item.difference !== 0 ? 'rgba(239,68,68,0.1)' : undefined,
                      borderRadius: item.difference !== 0 ? 4 : undefined,
                    }}>
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
        </div>
      )}

      {/* ===================== 跨店调拨 ===================== */}
      {activeTab === 'transfers' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transfers.map(transfer => (
              <div key={transfer.transferId} style={{
                padding: 18,
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 2px' }}>
                      {transfer.transferNo} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>({TRANSFER_TYPE_LABELS[transfer.type]})</span>
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                      {transfer.fromStore} → {transfer.toStore}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: getTransferStatusColor(transfer.status),
                      color: ['draft', 'pending', 'cancelled'].includes(transfer.status) ? '#ffffff' : '#0f172a',
                    }}>
                      {TRANSFER_STATUS_LABELS[transfer.status]}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {transfer.status === 'pending' && (
                        <button
                          onClick={() => handleApproveTransfer(transfer.transferId)}
                          style={actionButtonStyle('#3b82f6')}
                        >
                          审批
                        </button>
                      )}
                      {transfer.status === 'approved' && (
                        <button
                          onClick={() => handleExecuteTransfer(transfer.transferId)}
                          style={actionButtonStyle('#8b5cf6')}
                        >
                          执行
                        </button>
                      )}
                      {transfer.status === 'in_transit' && (
                        <button
                          onClick={() => handleReceiveTransfer(transfer.transferId)}
                          style={actionButtonStyle('#22c55e')}
                        >
                          接收
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
                  {transfer.items.map(item => (
                    <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#e2e8f0', marginBottom: 4 }}>
                      <span>{item.skuName}</span>
                      <span style={{ color: '#94a3b8' }}>×{item.quantity} {formatCurrency(item.costPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
          加载中...
        </div>
      )}
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

function actionButtonStyle(color: string): React.CSSProperties {
  return {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    background: color,
    color: '#ffffff',
  };
}
