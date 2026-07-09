/**
 * 积分兑换页 — 小程序端 (Taro)
 * 角色视角: 💎会员
 * 功能: 积分余额展示、兑换商品列表、兑换历史、分类筛选
 */
import { View, Text, Button, Input, Picker } from '@tarojs/components';
import { useState, useMemo } from 'react';
import Taro from '@tarojs/taro';

// ---- 类型 ----

type RedeemCategory = 'all' | 'digital' | 'voucher' | 'physical' | 'experience';
type RedeemStatus = 'available' | 'hot' | 'limited' | 'sold_out';

interface RedeemItem {
  id: string;
  name: string;
  points: number;
  category: RedeemCategory;
  status: RedeemStatus;
  stock: number;
  image: string;
  description: string;
}

interface RedeemRecord {
  id: string;
  itemName: string;
  points: number;
  date: string;
  status: 'pending' | 'shipped' | 'completed' | 'cancelled';
}

const CATEGORY_OPTIONS = ['全部', '数码', '优惠券', '实物', '体验'] as const;
const CATEGORY_MAP: Record<string, RedeemCategory | 'ALL'> = {
  '全部': 'ALL',
  '数码': 'digital',
  '优惠券': 'voucher',
  '实物': 'physical',
  '体验': 'experience',
};

const STATUS_LABELS: Record<RedeemStatus, string> = {
  available: '可兑换',
  hot: '热门',
  limited: '限时',
  sold_out: '已售罄',
};

const STATUS_COLORS: Record<RedeemStatus, string> = {
  available: '#22c55e',
  hot: '#ef4444',
  limited: '#f59e0b',
  sold_out: '#94a3b8',
};

// ---- 模拟数据 ----

const MOCK_POINTS_BALANCE = 12880;

const MOCK_REDEEM_ITEMS: RedeemItem[] = [
  { id: 'r1', name: '¥20 全场通用券', points: 800, category: 'voucher', status: 'hot', stock: 500, image: '🎫', description: '全场通用，满50可用' },
  { id: 'r2', name: '¥50 包厢优惠券', points: 2000, category: 'voucher', status: 'available', stock: 200, image: '🎫', description: '包厢消费满200可用' },
  { id: 'r3', name: '蓝牙耳机', points: 5000, category: 'digital', status: 'hot', stock: 30, image: '🎧', description: '高品质无线蓝牙耳机' },
  { id: 'r4', name: '定制保温杯', points: 1500, category: 'physical', status: 'limited', stock: 10, image: '🥤', description: '限量定制款保温杯' },
  { id: 'r5', name: '免费畅玩1小时', points: 1200, category: 'experience', status: 'available', stock: 100, image: '🎮', description: '全场设备通玩1小时' },
  { id: 'r6', name: '会员双倍积分卡', points: 600, category: 'voucher', status: 'hot', stock: 999, image: '💳', description: '7天内消费享双倍积分' },
  { id: 'r7', name: '智能手环', points: 8000, category: 'digital', status: 'available', stock: 15, image: '⌚', description: '运动健康智能手环' },
  { id: 'r8', name: '盲盒随机体验', points: 300, category: 'experience', status: 'limited', stock: 50, image: '🎁', description: '随机兑换一个趣味盲盒' },
  { id: 'r9', name: '品牌充电宝', points: 3500, category: 'digital', status: 'available', stock: 20, image: '🔋', description: '10000mAh快充充电宝' },
  { id: 'r10', name: '¥30 饮品兑换券', points: 1000, category: 'voucher', status: 'sold_out', stock: 0, image: '☕', description: '合作饮品店通用券' },
];

const MOCK_RECORDS: RedeemRecord[] = [
  { id: 'h1', itemName: '¥20 全场通用券', points: 800, date: '2026-07-08', status: 'completed' },
  { id: 'h2', itemName: '免费畅玩1小时', points: 1200, date: '2026-07-05', status: 'completed' },
  { id: 'h3', itemName: '定制保温杯', points: 1500, date: '2026-06-28', status: 'shipped' },
  { id: 'h4', itemName: '蓝牙耳机', points: 5000, date: '2026-06-20', status: 'completed' },
];

// ---- 子组件 ----

const PointsHeader: React.FC<{ balance: number }> = ({ balance }) => (
  <View style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '24px 16px', borderRadius: '12px', margin: '12px' }}>
    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>当前积分</Text>
    <Text style={{ color: '#fff', fontSize: '36px', fontWeight: 'bold', display: 'block', margin: '8px 0' }}>
      {balance.toLocaleString()}
    </Text>
    <View style={{ flexDirection: 'row', gap: '12px', marginTop: '8px' }}>
      <View style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{(balance / 100).toFixed(0)}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>可兑商品</Text>
      </View>
      <View style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '10px', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{MOCK_RECORDS.length}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>已兑换</Text>
      </View>
    </View>
  </View>
);

const RedeemCard: React.FC<{
  item: RedeemItem;
  onRedeem: (id: string) => void;
}> = ({ item, onRedeem }) => {
  const canRedeem = item.status !== 'sold_out';
  return (
    <View style={{
      background: '#fff', borderRadius: '12px', padding: '14px', margin: '6px 0',
      flexDirection: 'row', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <Text style={{ fontSize: '32px', marginRight: '12px' }}>{item.image}</Text>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
          <Text style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>{item.name}</Text>
          <Text style={{
            fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
            color: '#fff', backgroundColor: STATUS_COLORS[item.status],
          }}>{STATUS_LABELS[item.status]}</Text>
        </View>
        <Text style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>{item.description}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
          <Text style={{ fontSize: '14px', color: '#ef4444', fontWeight: '700' }}>{item.points.toLocaleString()} 积分</Text>
          {item.stock > 0 && item.stock <= 20 && (
            <Text style={{ fontSize: '11px', color: '#f59e0b' }}>仅剩 {item.stock} 件</Text>
          )}
        </View>
      </View>
      <Button
        style={{
          marginLeft: '10px', padding: '6px 14px', fontSize: '13px', lineHeight: '1.8',
          borderRadius: '20px', backgroundColor: canRedeem ? '#667eea' : '#d1d5db',
          color: '#fff', border: 'none',
        }}
        disabled={!canRedeem}
        onClick={() => onRedeem(item.id)}
      >
        {canRedeem ? '兑换' : '已售罄'}
      </Button>
    </View>
  );
};

// ---- 主页面 ----

export default function RedeemCenterPage() {
  const [activeTab, setActiveTab] = useState<'items' | 'history'>('items');
  const [category, setCategory] = useState<string>('全部');
  const [searchText, setSearchText] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<RedeemRecord | null>(null);

  const filteredItems = useMemo(() => {
    const cat = CATEGORY_MAP[category] ?? 'ALL';
    let list = MOCK_REDEEM_ITEMS;
    if (cat !== 'ALL') {
      list = list.filter((item) => item.category === cat);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }
    return list;
  }, [category, searchText]);

  const handleRedeem = (id: string) => {
    const item = MOCK_REDEEM_ITEMS.find((i) => i.id === id);
    if (!item) return;
    Taro.showModal({
      title: '确认兑换',
      content: `确定用 ${item.points.toLocaleString()} 积分兑换「${item.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '兑换成功', icon: 'success' });
        }
      },
    });
  };

  const handleCancelRecord = (record: RedeemRecord) => {
    Taro.showModal({
      title: '取消兑换',
      content: `确定取消「${record.itemName}」的兑换吗？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已取消', icon: 'none' });
          setSelectedRecord(null);
        }
      },
    });
  };

  const RECORD_STATUS_LABELS: Record<string, string> = {
    pending: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
  };

  const RECORD_STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    shipped: '#3b82f6',
    completed: '#22c55e',
    cancelled: '#94a3b8',
  };

  return (
    <View style={{ background: '#f3f4f6', minHeight: '100vh', paddingBottom: '20px' }}>
      {/* 顶部积分卡片 */}
      <PointsHeader balance={MOCK_POINTS_BALANCE} />

      {/* Tab 切换 */}
      <View style={{
        flexDirection: 'row', margin: '10px 12px', background: '#e5e7eb',
        borderRadius: '8px', padding: '2px',
      }}>
        {(['items', 'history'] as const).map((tab) => (
          <View
            key={tab}
            style={{
              flex: 1, textAlign: 'center', padding: '8px 0',
              borderRadius: '6px', fontWeight: activeTab === tab ? '600' : '400',
              backgroundColor: activeTab === tab ? '#fff' : 'transparent',
              color: activeTab === tab ? '#667eea' : '#6b7280',
            }}
            onClick={() => setActiveTab(tab)}
          >
            <Text>{tab === 'items' ? '兑换商品' : '兑换记录'}</Text>
          </View>
        ))}
      </View>

      {activeTab === 'items' && (
        <>
          {/* 分类筛选 */}
          <View style={{
            flexDirection: 'row', margin: '0 12px 8px', gap: '8px', flexWrap: 'wrap',
          }}>
            {CATEGORY_OPTIONS.map((opt) => (
              <View
                key={opt}
                style={{
                  padding: '5px 14px', borderRadius: '16px', fontSize: '13px',
                  backgroundColor: category === opt ? '#667eea' : '#fff',
                  color: category === opt ? '#fff' : '#374151',
                  boxShadow: category === opt ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onClick={() => setCategory(opt)}
              >
                <Text>{opt}</Text>
              </View>
            ))}
          </View>

          {/* 搜索 */}
          <View style={{ margin: '0 12px 8px' }}>
            <Input
              style={{
                background: '#fff', borderRadius: '8px', padding: '10px 14px',
                fontSize: '14px', width: '100%', boxSizing: 'border-box',
              }}
              placeholder="搜索商品名称"
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
            />
          </View>

          {/* 商品列表 */}
          <View style={{ margin: '0 12px' }}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <RedeemCard key={item.id} item={item} onRedeem={handleRedeem} />
              ))
            ) : (
              <View style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                <Text style={{ fontSize: '40px' }}>🔍</Text>
                <Text style={{ display: 'block', marginTop: '12px', fontSize: '14px' }}>暂无可兑换商品</Text>
              </View>
            )}
          </View>
        </>
      )}

      {activeTab === 'history' && (
        <View style={{ margin: '0 12px' }}>
          {MOCK_RECORDS.length > 0 ? (
            MOCK_RECORDS.map((record) => (
              <View key={record.id} style={{
                background: '#fff', borderRadius: '10px', padding: '12px', margin: '6px 0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{record.itemName}</Text>
                  <Text style={{
                    fontSize: '12px', padding: '2px 8px', borderRadius: '4px',
                    color: '#fff', backgroundColor: RECORD_STATUS_COLORS[record.status],
                  }}>{RECORD_STATUS_LABELS[record.status]}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: '6px' }}>
                  <Text style={{ fontSize: '12px', color: '#9ca3af' }}>{record.date}</Text>
                  <Text style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>-{record.points.toLocaleString()} 积分</Text>
                </View>
                {record.status === 'pending' && (
                  <Button
                    style={{
                      marginTop: '8px', padding: '4px 12px', fontSize: '12px',
                      borderRadius: '4px', backgroundColor: '#fee2e2', color: '#ef4444',
                      border: 'none', width: 'auto',
                    }}
                    onClick={() => handleCancelRecord(record)}
                  >
                    取消兑换
                  </Button>
                )}
              </View>
            ))
          ) : (
            <View style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <Text style={{ fontSize: '40px' }}>📋</Text>
              <Text style={{ display: 'block', marginTop: '12px', fontSize: '14px' }}>暂无兑换记录</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
