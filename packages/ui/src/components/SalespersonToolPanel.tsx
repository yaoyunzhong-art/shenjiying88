'use client';

import React, { useState } from 'react';

// ============================================================
// 类型定义
// ============================================================

/** 客户卡片信息 */
export interface CustomerBrief {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  membership: 'regular' | 'silver' | 'gold' | 'diamond';
  totalSpent: number;
  lastVisit: string;
  tags: string[];
}

/** 客户偏好/兴趣标签 */
export interface CustomerPreference {
  category: string;
  score: number; // 0-100
  label: string;
}

/** 商品推荐项 */
export interface ProductRecommendation {
  id: string;
  name: string;
  price: number;
  image?: string;
  reason: string; // 推荐理由
  stock: number;
}

/** 销售任务 */
export interface SalesTask {
  id: string;
  title: string;
  type: 'follow_up' | 'promotion' | 'onboarding' | 'survey';
  targetCustomer: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

/** 绩效卡片 */
export interface PerformanceCard {
  dailySales: number;
  monthlySales: number;
  customersServed: number;
  conversionRate: number;
  targetProgress: number; // 0-100
}

/** 导购员工具面板 Props */
export interface SalespersonToolPanelProps {
  /** 当前导购员姓名 */
  salespersonName?: string;
  /** 当前客户信息（扫码/搜索后） */
  currentCustomer?: CustomerBrief | null;
  /** 客户偏好 */
  preferences?: CustomerPreference[];
  /** 商品推荐列表 */
  recommendations?: ProductRecommendation[];
  /** 待办任务 */
  tasks?: SalesTask[];
  /** 当日绩效 */
  performance?: PerformanceCard;
  /** 加载中 */
  loading?: boolean;
  /** 客户搜索回调 */
  onSearchCustomer?: (keyword: string) => void;
  /** 添加客户到购物车 */
  onAddToCart?: (productId: string) => void;
  /** 分享商品 */
  onShareProduct?: (productId: string) => void;
  /** 完成/跟进任务 */
  onCompleteTask?: (taskId: string) => void;
  /** 扫码 */
  onScan?: () => void;
  /** 自定义类名 */
  className?: string;
}

// ============================================================
// 样式常量
// ============================================================

const PANEL_STYLE: React.CSSProperties = {
  backgroundColor: '#0f172a',
  color: '#e2e8f0',
  borderRadius: 12,
  padding: 20,
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#f1f5f9',
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const PRIMARY_BUTTON: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
};

const SECONDARY_BUTTON: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#1e293b',
  color: '#94a3b8',
  border: '1px solid #334155',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: 13,
};

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: 10,
  padding: 14,
  marginBottom: 10,
};

const MEMBERSHIP_COLORS: Record<CustomerBrief['membership'], string> = {
  regular: '#94a3b8',
  silver: '#c0c0c0',
  gold: '#f59e0b',
  diamond: '#6366f1',
};

const PRIORITY_COLORS: Record<SalesTask['priority'], string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#64748b',
};

// ============================================================
// 子组件
// ============================================================

/** 客户信息卡片 */
function CustomerInfoCard({ customer }: { customer: CustomerBrief }) {
  const tags = customer.tags ?? [];

  return (
    <div style={CARD_STYLE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 600,
              color: '#f1f5f9',
            }}
          >
            {customer.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{customer.name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{customer.phone}</div>
          </div>
        </div>
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: 12,
              backgroundColor: MEMBERSHIP_COLORS[customer.membership] + '22',
              color: MEMBERSHIP_COLORS[customer.membership],
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {customer.membership.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
        <span>累计消费: <strong style={{ color: '#22c55e' }}>¥{customer.totalSpent.toFixed(0)}</strong></span>
        <span>上次到店: <strong>{customer.lastVisit}</strong></span>
      </div>

      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '2px 8px',
                borderRadius: 10,
                backgroundColor: '#334155',
                color: '#94a3b8',
                fontSize: 11,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** 偏好雷达（简化为列表条） */
function PreferenceBar({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: '#64748b' }}>{score}%</span>
      </div>
      <div
        style={{
          height: 6,
          backgroundColor: '#1e293b',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            backgroundColor: score > 70 ? '#22c55e' : score > 40 ? '#f59e0b' : '#3b82f6',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

/** 推荐商品卡片 */
function RecommendationCard({
  item,
  onAddToCart,
  onShare,
}: {
  item: ProductRecommendation;
  onAddToCart?: () => void;
  onShare?: () => void;
}) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.name}</div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>¥{item.price}</span>
          {' · '}库存: {item.stock}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>{item.reason}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button style={PRIMARY_BUTTON} onClick={onAddToCart}>加购</button>
        <button style={SECONDARY_BUTTON} onClick={onShare}>分享</button>
      </div>
    </div>
  );
}

/** 任务项 */
function TaskItem({
  task,
  onComplete,
}: {
  task: SalesTask;
  onComplete?: () => void;
}) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: task.completed ? 0.5 : 1,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: task.completed ? '#22c55e' : PRIORITY_COLORS[task.priority],
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontWeight: 600,
              fontSize: 13,
              textDecoration: task.completed ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginLeft: 16 }}>
          {task.targetCustomer} · 截止 {task.dueDate}
        </div>
      </div>
      {!task.completed && (
        <button
          style={{
            ...PRIMARY_BUTTON,
            backgroundColor: '#22c55e',
            fontSize: 12,
            padding: '6px 12px',
          }}
          onClick={onComplete}
        >
          完成
        </button>
      )}
    </div>
  );
}

// ============================================================
// 主组件
// ============================================================

export function SalespersonToolPanel({
  salespersonName = '导购员',
  currentCustomer,
  preferences = [],
  recommendations = [],
  tasks = [],
  performance,
  loading = false,
  onSearchCustomer,
  onAddToCart,
  onShareProduct,
  onCompleteTask,
  onScan,
  className,
}: SalespersonToolPanelProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'customer' | 'recommend' | 'tasks' | 'stats'>('customer');

  const handleSearch = () => {
    if (searchKeyword.trim() && onSearchCustomer) {
      onSearchCustomer(searchKeyword.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={PANEL_STYLE} className={className}>
      {/* 头部 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>
            {salespersonName}
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0 0' }}>导购员工作台</p>
        </div>
        <button
          style={{
            ...PRIMARY_BUTTON,
            backgroundColor: '#6366f1',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          onClick={onScan}
        >
          📷 <span>扫码</span>
        </button>
      </div>

      {/* 搜索栏 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 搜索客户姓名/手机号..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ ...INPUT_STYLE, flex: 1 }}
        />
        <button
          style={{
            ...PRIMARY_BUTTON,
            whiteSpace: 'nowrap',
          }}
          onClick={handleSearch}
        >
          搜索
        </button>
      </div>

      {/* 当前客户 */}
      {currentCustomer && <CustomerInfoCard customer={currentCustomer} />}

      {/* Tab 导航 */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 14,
          borderBottom: '1px solid #1e293b',
          paddingBottom: 8,
        }}
      >
        {[
          { key: 'customer' as const, label: '客户偏好', badge: preferences.length },
          { key: 'recommend' as const, label: '推荐商品', badge: recommendations.length },
          { key: 'tasks' as const, label: '待办任务', badge: tasks.filter((t) => !t.completed).length },
          { key: 'stats' as const, label: '绩效', badge: undefined as number | undefined },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: activeTab === tab.key ? '#3b82f6' : '#64748b',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: -8,
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontSize: 10,
                  borderRadius: 8,
                  padding: '1px 6px',
                  fontWeight: 600,
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div>加载中...</div>
        </div>
      ) : (
        <>
          {/* 客户偏好 Tab */}
          {activeTab === 'customer' && (
            <div>
              {preferences.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>
                  {currentCustomer
                    ? '暂无该客户的偏好数据'
                    : '请先搜索或扫码选择客户'}
                </div>
              ) : (
                preferences.map((p) => (
                  <PreferenceBar key={p.category} label={p.label} score={p.score} />
                ))
              )}
            </div>
          )}

          {/* 商品推荐 Tab */}
          {activeTab === 'recommend' && (
            <div>
              {recommendations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>
                  {currentCustomer ? '暂无推荐商品' : '请先选择客户以获取个性化推荐'}
                </div>
              ) : (
                recommendations.map((item) => (
                  <RecommendationCard
                    key={item.id}
                    item={item}
                    onAddToCart={() => onAddToCart?.(item.id)}
                    onShare={() => onShareProduct?.(item.id)}
                  />
                ))
              )}
            </div>
          )}

          {/* 待办任务 Tab */}
          {activeTab === 'tasks' && (
            <div>
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>
                  暂无待办任务
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={() => onCompleteTask?.(task.id)}
                  />
                ))
              )}
            </div>
          )}

          {/* 绩效 Tab */}
          {activeTab === 'stats' && (
            <div>
              {!performance ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>
                  暂无绩效数据
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <StatCard label="今日销售额" value={`¥${performance.dailySales.toFixed(0)}`} color="#22c55e" />
                  <StatCard label="本月销售额" value={`¥${performance.monthlySales.toFixed(0)}`} color="#3b82f6" />
                  <StatCard label="服务客户" value={`${performance.customersServed}人`} color="#f59e0b" />
                  <StatCard label="转化率" value={`${(performance.conversionRate * 100).toFixed(1)}%`} color="#6366f1" />

                  {/* 目标进度条 */}
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      ...CARD_STYLE,
                    }}
                  >
                    <div style={{ fontSize: 13, marginBottom: 8, color: '#94a3b8' }}>
                      月目标进度: <strong style={{ color: '#f1f5f9' }}>{performance.targetProgress}%</strong>
                    </div>
                    <div style={{ height: 10, backgroundColor: '#0f172a', borderRadius: 5, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(performance.targetProgress, 100)}%`,
                          backgroundColor:
                            performance.targetProgress >= 80
                              ? '#22c55e'
                              : performance.targetProgress >= 50
                              ? '#f59e0b'
                              : '#3b82f6',
                          borderRadius: 5,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** 绩效数值卡片 */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        borderRadius: 10,
        padding: 14,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
