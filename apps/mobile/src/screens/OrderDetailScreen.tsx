/**
 * OrderDetailScreen.tsx - Phase-21 T53
 * 订单详情页（含状态流转、编辑/删除/退款操作）
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetail {
  id: string;
  orderNo: string;
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  shippingAddress?: string;
  remark?: string;
}

interface OrderDetailScreenProps {
  order?: OrderDetail;
  userRole?: 'clerk' | 'manager' | 'admin';
  onEdit?: (order: OrderDetail) => void;
  onCancel?: (order: OrderDetail) => void;
  onConfirm?: (order: OrderDetail) => void;
  onShip?: (order: OrderDetail) => void;
  onDeliver?: (order: OrderDetail) => void;
  onRefund?: (order: OrderDetail) => void;
  onDelete?: (order: OrderDetail) => void;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已送达',
  cancelled: '已取消',
  refunded: '已退款',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#2563eb',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#9ca3af',
};

/** 状态流转映射: 当前状态 → 可执行操作 */
const STATUS_TRANSITIONS: Record<OrderStatus, Array<{ action: string; label: string; handler: keyof OrderDetailScreenProps; color: string }>> = {
  pending: [
    { action: 'confirm', label: '确认订单', handler: 'onConfirm', color: '#2563eb' },
    { action: 'cancel', label: '取消订单', handler: 'onCancel', color: '#ef4444' },
  ],
  confirmed: [
    { action: 'process', label: '开始处理', handler: 'onShip', color: '#8b5cf6' },
    { action: 'cancel', label: '取消订单', handler: 'onCancel', color: '#ef4444' },
  ],
  processing: [
    { action: 'ship', label: '标记发货', handler: 'onShip', color: '#06b6d4' },
  ],
  shipped: [
    { action: 'deliver', label: '确认送达', handler: 'onDeliver', color: '#22c55e' },
  ],
  delivered: [
    { action: 'refund', label: '申请退款', handler: 'onRefund', color: '#f59e0b' },
  ],
  cancelled: [],
  refunded: [],
};

// TODO: T55 替换为真实 useQuery 数据
const DEFAULT_ORDER: OrderDetail = {
  id: 'ord-001',
  orderNo: 'ORD202607080001',
  status: 'confirmed',
  totalAmount: 299.00,
  paidAmount: 299.00,
  createdAt: '2026-07-08 10:30:00',
  updatedAt: '2026-07-08 10:35:00',
  customerName: '王五',
  customerPhone: '136****9876',
  items: [
    { name: '经典拿铁', quantity: 2, price: 32.00 },
    { name: '抹茶蛋糕', quantity: 1, price: 45.00 },
    { name: '会员周卡', quantity: 1, price: 190.00 },
  ],
  shippingAddress: '',
  remark: '少糖',
};

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({
  order = DEFAULT_ORDER,
  userRole = 'clerk',
  onEdit,
  onCancel,
  onConfirm,
  onShip,
  onDeliver,
  onRefund,
  onDelete,
}) => {
  const canEdit = userRole === 'manager' || userRole === 'admin';
  const canManage = userRole === 'admin';
  const transitions = canEdit ? (STATUS_TRANSITIONS[order.status] || []) : [];

  const getHandler = (key: string) => {
    const map: Record<string, ((o: OrderDetail) => void) | undefined> = {
      onCancel, onConfirm, onShip, onDeliver, onRefund,
    };
    return map[key] ?? undefined;
  };

  return (
    <ScrollView style={styles.container}>
      {/* 订单状态卡片 */}
      <View style={styles.statusCard}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[order.status]}</Text>
        </View>
        <Text style={styles.orderNo}>{order.orderNo}</Text>
        <Text style={styles.amount}>¥{order.totalAmount.toFixed(2)}</Text>
      </View>

      {/* 客户信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>客户信息</Text>
        <InfoRow label="客户名" value={order.customerName} />
        <InfoRow label="联系电话" value={order.customerPhone} />
        {order.shippingAddress ? (
          <InfoRow label="配送地址" value={order.shippingAddress} />
        ) : null}
        {order.remark ? <InfoRow label="备注" value={order.remark} /> : null}
      </View>

      {/* 商品明细 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品明细</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQty}>×{item.quantity}</Text>
            <Text style={styles.itemPrice}>¥{(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>订单金额</Text>
          <Text style={styles.totalValue}>¥{order.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>已付金额</Text>
          <Text style={styles.paidValue}>¥{order.paidAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* 时间信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>时间信息</Text>
        <InfoRow label="创建时间" value={order.createdAt} />
        <InfoRow label="最近更新" value={order.updatedAt} />
      </View>

      {/* 状态流转操作 */}
      {transitions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>操作</Text>
          <View style={styles.buttonGroup}>
            {transitions.map((t) => {
              const handler = getHandler(t.handler);
              return (
                <TouchableOpacity
                  key={t.action}
                  style={[styles.actionBtn, { backgroundColor: t.color }]}
                  onPress={() => handler?.(order)}
                  accessibilityLabel={t.label}
                >
                  <Text style={styles.actionBtnText}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 管理操作 — 仅 admin */}
      {canManage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>管理</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => onEdit?.(order)}
              accessibilityLabel="编辑订单"
            >
              <Text style={styles.primaryBtnText}>编辑订单</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={() => onDelete?.(order)}
              accessibilityLabel="删除订单"
            >
              <Text style={styles.dangerBtnText}>删除订单</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

/** 信息行 */
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusBadgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  orderNo: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  amount: { fontSize: 28, fontWeight: '700', color: '#1f2937' },
  section: { backgroundColor: '#fff', padding: 16, marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  itemName: { flex: 1, fontSize: 14, color: '#1f2937' },
  itemQty: { fontSize: 14, color: '#6b7280', marginRight: 16, width: 40, textAlign: 'right' },
  itemPrice: { fontSize: 14, color: '#1f2937', fontWeight: '600', width: 80, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  paidValue: { fontSize: 16, fontWeight: '700', color: '#22c55e' },
  buttonGroup: { gap: 10 },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dangerBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export type { OrderDetail, OrderStatus, OrderItem, OrderDetailScreenProps };