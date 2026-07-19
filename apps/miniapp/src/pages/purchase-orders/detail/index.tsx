/**
 * 采购单详情页 — 小程序端 (Taro)
 * 角色视角: 👔店长
 * 功能: 详情展示、状态流转、编辑/删除操作
 */
import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useEffect, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import {
  deleteMiniappPurchaseOrder,
  executeMiniappPurchaseOrderAction,
  loadMiniappPurchaseOrderDetail,
  type MiniappPurchaseOrderDetail,
} from '../../../supplychain-runtime';

// ---- 类型 ----

type OrderStatus = MiniappPurchaseOrderDetail['status'];
type PurchaseOrderItem = MiniappPurchaseOrderDetail['items'][number];
type PurchaseOrderDetail = MiniappPurchaseOrderDetail;

// ---- 常量 ----

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: '草稿', submitted: '已提交', confirmed: '已确认',
  shipped: '已发货', received: '已收货', cancelled: '已取消',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  draft: '#f59e0b', submitted: '#3b82f6', confirmed: '#22c55e',
  shipped: '#06b6d4', received: '#64748b', cancelled: '#ef4444',
};

const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['received'],
};

// ---- Mock 数据 ----

const MOCK_DETAIL: PurchaseOrderDetail = {
  id: '1',
  orderNo: 'PO-20260601-001',
  supplier: '广州美妆供应链有限公司',
  supplierContact: '李经理',
  supplierPhone: '13800138001',
  totalAmount: 28600,
  status: 'received',
  items: [
    { sku: 'SKU-001', name: '玫瑰精华面膜', spec: '30ml/盒', qty: 200, unit: '盒', unitPrice: 68, amount: 13600 },
    { sku: 'SKU-002', name: '塑颜紧致精华', spec: '50ml/瓶', qty: 100, unit: '瓶', unitPrice: 120, amount: 12000 },
    { sku: 'SKU-003', name: '旅行套装', spec: '5件套', qty: 50, unit: '套', unitPrice: 60, amount: 3000 },
  ],
  itemsCount: 3,
  orderDate: '2026-06-01',
  expectedDate: '2026-06-10',
  remark: '请确保包装完好，避免运输破损',
  creator: '张三',
  approver: '李四',
};

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getStatusActions(status: OrderStatus): OrderStatus[] {
  return STATUS_TRANSITIONS[status] ?? [];
}

function resolveCurrentOrderId(): string {
  return Taro.getCurrentInstance()?.router?.params?.id ?? MOCK_DETAIL.id;
}

// ---- 组件 ----

const PurchaseOrderDetailPage = () => {
  const [detail, setDetail] = useState<PurchaseOrderDetail>(MOCK_DETAIL);
  const [deliveryNote, setDeliveryNote] = useState('当前展示本地演示采购单详情。');
  const [localStatus, setLocalStatus] = useState<OrderStatus>(detail.status);
  const orderId = useMemo(() => resolveCurrentOrderId(), []);

  useEffect(() => {
    let cancelled = false;

    loadMiniappPurchaseOrderDetail(orderId, MOCK_DETAIL).then((snapshot) => {
      if (!cancelled) {
        setDetail(snapshot.data);
        setDeliveryNote(snapshot.note);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    setLocalStatus(detail.status);
  }, [detail.status]);

  const handleStatusChange = (newStatus: OrderStatus) => {
    Taro.showModal({
      title: '确认操作',
      content: `确定将订单状态变更为「${STATUS_LABELS[newStatus]}」吗？`,
      success: (res) => {
        if (res.confirm) {
          void executeMiniappPurchaseOrderAction(orderId, newStatus, detail).then((result) => {
            setLocalStatus(result.nextStatus);
            setDeliveryNote(result.note);
            Taro.showToast({
              title: result.deliveryMode === 'api' ? '状态已同步' : '已切演示态',
              icon: 'success',
            });
          });
        }
      },
    });
  };

  const handleEdit = () => {
    Taro.showToast({ title: '编辑功能待实现', icon: 'none' });
  };

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      success: (res) => {
        if (res.confirm) {
          void deleteMiniappPurchaseOrder(orderId).then((result) => {
            setDeliveryNote(result.note);
            Taro.showToast({ title: '删除成功', icon: 'success' });
            Taro.navigateBack();
          });
        }
      },
    });
  };

  const availableActions = getStatusActions(localStatus);

  return (
    <ScrollView className='purchase-order-detail' style={{ padding: 16, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 订单头部 */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{detail.orderNo}</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: STATUS_COLORS[localStatus] }}>
            {STATUS_LABELS[localStatus]}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: '#999' }}>创建日期: {detail.orderDate}</Text>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>预计到货: {detail.expectedDate}</Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{deliveryNote}</Text>
      </View>

      {/* 供应商信息 */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>供应商信息</Text>
        <InfoRow label='供应商' value={detail.supplier} />
        <InfoRow label='联系人' value={detail.supplierContact} />
        <InfoRow label='联系电话' value={detail.supplierPhone} />
      </View>

      {/* 商品明细 */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          商品明细（共 {detail.items.length} 项）
        </Text>
        {detail.items.map((item, index) => (
          <View
            key={item.sku}
            style={{
              paddingTop: 10, paddingBottom: 10,
              borderTopWidth: index > 0 ? 1 : 0,
              borderTopColor: '#eee',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500' }}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {item.spec} | {item.qty}{item.unit} × {formatAmount(item.unitPrice)}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: '#999' }}>SKU: {item.sku}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#e74c3c' }}>{formatAmount(item.amount)}</Text>
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#ddd', marginTop: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600' }}>合计</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#e74c3c' }}>{formatAmount(detail.totalAmount)}</Text>
        </View>
      </View>

      {/* 备注 */}
      {detail.remark && (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>备注</Text>
          <Text style={{ fontSize: 14, color: '#666' }}>{detail.remark}</Text>
        </View>
      )}

      {/* 审批信息 */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>审批信息</Text>
        <InfoRow label='创建人' value={detail.creator} />
        <InfoRow label='审批人' value={detail.approver} />
      </View>

      {/* 操作按钮 */}
      <View style={{ marginTop: 16, marginBottom: 32 }}>
        <Button
          onClick={handleEdit}
          style={{
            backgroundColor: '#3b82f6',
            color: '#fff',
            borderRadius: 8,
            marginBottom: 10,
            padding: 12,
            textAlign: 'center',
          }}
        >
          编辑
        </Button>

        {availableActions.map((action) => (
          <Button
            key={action}
            onClick={() => handleStatusChange(action)}
            style={{
              backgroundColor: '#22c55e',
              color: '#fff',
              borderRadius: 8,
              marginBottom: 10,
              padding: 12,
              textAlign: 'center',
            }}
          >
            标记为「{STATUS_LABELS[action]}」
          </Button>
        ))}

        {localStatus !== 'cancelled' && (
          <Button
            onClick={handleDelete}
            style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              borderRadius: 8,
              padding: 12,
              textAlign: 'center',
            }}
          >
            删除此订单
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

// ---- 子组件 ----

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, paddingBottom: 6 }}>
      <Text style={{ fontSize: 14, color: '#666' }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#333' }}>{value}</Text>
    </View>
  );
}

export default PurchaseOrderDetailPage;
export { formatAmount, getStatusActions, MOCK_DETAIL, resolveCurrentOrderId };
export type { PurchaseOrderDetail, PurchaseOrderItem, OrderStatus, InfoRowProps };
