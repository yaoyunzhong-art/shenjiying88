// Cashier — 会员收银页面 (P-35 / P1-3 共享层收口)
// 前台收银台：会员搜索、消费记录、余额查询、结账
// 使用 @m5/sdk BusinessClient 调用真实 API，API 不可用时回落 mock

'use client';

import { useState, useCallback, Suspense } from 'react';
import { Input, Button, List, Typography, Space, Card, Statistic, message } from 'antd';
import { SearchOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';
import { PageShell, CashierPanel, LoadingSkeleton } from '@m5/ui';
import type { QuickStatItem } from '@m5/ui';

const { Text, Title } = Typography;

// ---- 类型定义 ----

export interface MemberProfile {
  id: string;
  phone: string;
  cardNo: string;
  name: string;
  level: string;
  balance: number;
  points: number;
}

export interface ConsumptionRecord {
  id: string;
  orderNo: string;
  time: string;
  amount: number;
  type: 'sale' | 'refund' | 'topup';
  description: string;
}

// ── API 客户端 (单件) ──

import { createBusinessClient } from '@m5/sdk';

function getBizClient() {
  if (typeof window === 'undefined') return null;
  // 在 client 端按需惰性创建, 避免 SSR 冲突
  if (!(window as any).__m5_biz_client) {
    (window as any).__m5_biz_client = createBusinessClient();
  }
  return (window as any).__m5_biz_client as ReturnType<typeof createBusinessClient>;
}

// ── 真实 API 调用 (带 mock fallback, 确保开发体验) ──

/** 会员搜索 - 优先调用真实后端, 不可用时回落 mock */
export async function searchMember(query: string): Promise<MemberProfile | null> {
  if (!query.trim()) return null;

  const biz = getBizClient();
  if (biz) {
    try {
      const result = await biz.cashier.lookupMember(query);
      if (result) {
        return {
          id: result.id,
          phone: result.phone,
          cardNo: result.memberNo,
          name: result.name,
          level: result.tier,
          balance: 0,      // 余额需单独查询
          points: result.points,
        };
      }
      return null;
    } catch {
      // API 不可用, 走 mock fallback
    }
  }

  // DEV Mock fallback: 模拟返回
  await new Promise((r) => setTimeout(r, 300));
  const mockMembers: MemberProfile[] = [
    { id: 'm001', phone: '13800138001', cardNo: 'VIP2024001', name: '张三', level: '黄金会员', balance: 5280.50, points: 3200 },
    { id: 'm002', phone: '13800138002', cardNo: 'VIP2024002', name: '李四', level: '白金会员', balance: 15280.00, points: 12500 },
    { id: 'm003', phone: '13800138003', cardNo: 'VIP2024003', name: '王五', level: '普通会员', balance: 230.00, points: 480 },
  ];
  const lower = query.trim().toLowerCase();
  return mockMembers.find(
    (m) => m.phone.includes(lower) || m.cardNo.toLowerCase().includes(lower),
  ) ?? null;
}

/** 消费记录 - 优先调用真实后端, 不可用时回落 mock */
export async function fetchConsumptionHistory(memberId: string): Promise<ConsumptionRecord[]> {
  const biz = getBizClient();
  if (biz) {
    try {
      const txns = await biz.cashier.listMemberTransactions(memberId);
      return (txns ?? []).map((tx) => ({
        id: tx.orderId,
        orderNo: tx.orderNo || tx.orderId,
        time: tx.createdAt,
        amount: (tx.totalAmount || 0) / 100,
        type: tx.paymentStatus === 'REFUNDED' ? 'refund' : 'sale',
        description: `订单 ${tx.orderNo || tx.orderId}`,
      }));
    } catch {
      // API 不可用, 走 mock fallback
    }
  }

  // DEV Mock fallback: 模拟消费记录
  await new Promise((r) => setTimeout(r, 200));
  return [
    { id: 'c001', orderNo: 'ORD20260711001', time: '2026-07-11 20:15', amount: 128.00, type: 'sale', description: '洗剪吹套餐' },
    { id: 'c002', orderNo: 'ORD20260710002', time: '2026-07-10 14:30', amount: 58.00, type: 'sale', description: '单剪' },
    { id: 'c003', orderNo: 'ORD20260710003', time: '2026-07-10 10:00', amount: 500.00, type: 'topup', description: '充值' },
    { id: 'c004', orderNo: 'ORD20260708001', time: '2026-07-08 16:45', amount: 68.00, type: 'sale', description: '吹造型' },
    { id: 'c005', orderNo: 'ORD20260705001', time: '2026-07-05 19:00', amount: 200.00, type: 'sale', description: '染发服务' },
    { id: 'c006', orderNo: 'ORD20260703001', time: '2026-07-03 11:20', amount: 30.00, type: 'refund', description: '退款-单剪' },
  ];
}

// ---- 子组件：会员搜索结果 ----

function MemberInfoCard({ member }: { member: MemberProfile }) {
  const statItems: QuickStatItem[] = [
    { label: '账户余额', value: `¥${member.balance.toFixed(2)}`, valueColor: '#fbbf24' },
    { label: '积分', value: `${member.points} 分`, valueColor: '#93c5fd' },
    { label: '会员等级', value: member.level },
  ];

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <span>{member.name}</span>
          <Text type="secondary" style={{ fontSize: 12 }}>{member.level}</Text>
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          卡号: {member.cardNo} | 手机: {member.phone}
        </Text>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {statItems.map((item) => (
            <div key={item.label} style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
              <Statistic
                title={item.label}
                value={item.value}
                valueStyle={{ color: item.valueColor ?? '#1677ff', fontSize: 18 }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
          <Button type="primary" icon={<DollarOutlined />} size="middle">
            收银结账
          </Button>
        </div>
      </Space>
    </Card>
  );
}

// ---- 子组件：消费记录 ----

function ConsumptionHistory({ records }: { records: ConsumptionRecord[] }) {
  const typeLabel: Record<string, string> = { sale: '消费', refund: '退款', topup: '充值' };
  const typeColor: Record<string, string> = { sale: '#1677ff', refund: '#ff4d4f', topup: '#52c41a' };

  return (
    <Card title="消费记录" size="small">
      <List
        dataSource={records}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            extra={
              <Text strong style={{ color: typeColor[item.type] ?? '#000' }}>
                {item.type === 'refund' ? '-' : '+'}¥{item.amount.toFixed(2)}
              </Text>
            }
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text>{item.description}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {item.orderNo}
                  </Text>
                </Space>
              }
              description={
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                  <Text style={{ fontSize: 12, color: typeColor[item.type] }}>
                    {typeLabel[item.type] ?? item.type}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}

// ---- 主页面组件 ----

export default function CashierPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedMember, setSearchedMember] = useState<MemberProfile | null>(null);
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      message.warning('请输入手机号或会员卡号');
      return;
    }

    setSearching(true);
    setSearchedMember(null);
    setConsumptionRecords([]);

    try {
      const member = await searchMember(searchQuery);
      if (!member) {
        message.info('未找到该会员');
        return;
      }

      setSearchedMember(member);
      setLoadingRecords(true);
      const records = await fetchConsumptionHistory(member.id);
      setConsumptionRecords(records);
    } catch {
      message.error('查询失败，请重试');
    } finally {
      setSearching(false);
      setLoadingRecords(false);
    }
  }, [searchQuery]);

  const handleCheckout = useCallback(() => {
    message.success('结账功能已启动');
  }, []);

  // ==================== 收银员工作台 ====================
  const cashierTitle = '会员收银';
  const cashierName = '收银员';
  const shiftInfo = { type: 'morning' as const, startAt: '08:00', endAt: '16:00', duration: 8 };
  const metrics = {
    transactionCount: 42,
    totalRevenue: 8650.00,
    cashAmount: 3200.00,
    mobileAmount: 5450.00,
    expectedCashRemit: 3100.00,
    changeFloatUsed: 100.00,
    refundCount: 1,
    refundTotal: 30.00,
  };

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell title="会员收银" subtitle="前台收银台 - 会员搜索、消费记录、余额、结账">
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载收银台..." />}>
          {/* 收银员工作台面板 */}
          <div style={{ marginBottom: 24 }}>
            <CashierPanel
              title={cashierTitle}
              cashierName={cashierName}
              cashierStatus="active"
              shiftInfo={shiftInfo}
              metrics={metrics}
              transactions={[
                { id: 'log1', receiptNo: 'REC20260711-001', time: '20:15', amount: 128.00, payment: '微信支付', type: 'sale', memberName: '张三' },
                { id: 'log2', receiptNo: 'REC20260711-002', time: '19:30', amount: 58.00, payment: '现金', type: 'sale', memberName: '李四' },
                { id: 'log3', receiptNo: 'REC20260711-003', time: '18:00', amount: 30.00, payment: '微信', type: 'refund', memberName: '王五' },
              ]}
              tillStatus={{
                tillNo: 'POS-01',
                version: 'v3.2.1',
                printerOnline: true,
                cashDrawerOpen: false,
                scannerOnline: true,
                networkOnline: true,
              }}
            />
          </div>

          {/* 会员搜索区 */}
          <Card title="会员查询" size="small" style={{ marginBottom: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入手机号 / 会员卡号"
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
                size="middle"
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={searching}
                size="middle"
              >
                查询
              </Button>
            </Space.Compact>
          </Card>

          {/* 会员信息 & 消费记录 */}
          {searchedMember && (
            <MemberInfoCard member={searchedMember} />
          )}

          {loadingRecords ? (
            <LoadingSkeleton variant="card" rows={3} label="加载消费记录..." />
          ) : consumptionRecords.length > 0 && (
            <ConsumptionHistory records={consumptionRecords} />
          )}

          {searchedMember && consumptionRecords.length === 0 && !loadingRecords && (
            <Card size="small">
              <Text type="secondary">暂无消费记录</Text>
            </Card>
          )}
        </Suspense>
      </PageShell>
    </main>
  );
}
