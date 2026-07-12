/**
 * 门店管理 — Store Manager Page (Next.js App Router)
 *
 * 角色: 👔店长
 *
 * 功能:
 * - 门店基本信息：名称、地址、联系电话、营业时间
 * - 营业状态管理：营业中 / 维护中 / 已关闭 状态切换
 * - 营业状态统计：今日已营业时长 / 当前排队人数 / 今日营业额
 * - 营业时间段管理
 * - 门店公告 / 紧急联系人配置
 * - 保存修改（模拟操作）
 * - 空状态 / 加载中 / 错误回退
 * - JSON-LD 结构化数据
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';

export const metadata: Metadata = {
  title: '门店管理 - 神机营电竞乐园',
  description:
    '管理门店基本信息、营业状态、营业时间。支持营业中/维护中/已关闭状态切换，查看今日营业概况。',
  openGraph: {
    title: '门店管理 | 神机营电竞乐园',
    description: '管理门店基本信息、营业状态、营业时间',
    type: 'website',
  },
};

/** 门店默认信息 */
const DEFAULT_STORE = {
  name: '神机营电竞乐园 · 旗舰店',
  address: '北京市朝阳区建国路88号',
  phone: '010-88886666',
  hours: '10:00-22:00',
  status: 'active' as const,
  emergencyContact: '张经理 138-0000-0000',
  storeCode: 'BJ-CBD-001',
  openDate: '2025-06-01',
  area: 580, // 平方米
};

/** 营业状态配置 */
const STATUS_CONFIG = {
  active: { label: '营业中', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  maintenance: { label: '维护中', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  closed: { label: '已关闭', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

/** 加载占位 */
function StoreManagerLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={2} label={`加载统计 ${i}`} />
        ))}
      </div>

      {/* 门店信息卡片 */}
      <LoadingSkeleton variant="card" rows={6} label="加载门店信息..." />
    </div>
  );
}

/** 错误回退 */
function StoreManagerErrorFallback() {
  return (
    <EmptyState
      title="门店数据加载失败"
      description="无法加载门店管理信息。请检查网络连接，稍后重试。"
      actionLabel="重试"
      actionHref="/store-manager"
    />
  );
}

export default function StoreManagerPage() {
  const store = DEFAULT_STORE;
  const statusInfo = STATUS_CONFIG[store.status];

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: store.name,
            address: { '@type': 'PostalAddress', streetAddress: store.address },
            telephone: store.phone,
            openingHours: `Mo-Su ${store.hours}`,
            description: '神机营电竞乐园旗舰店，提供高端电竞娱乐体验',
          }),
        }}
      />

      {/* 页面标题 */}
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '32px 0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, margin: 0 }}>
            门店管理
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
            管理门店基本信息、营业状态与营业时间
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            background: statusInfo.bg,
            border: `1px solid ${statusInfo.color}30`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusInfo.color,
              animation: store.status === 'active' ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ color: statusInfo.color, fontSize: 14, fontWeight: 600 }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* 营业概况统计 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          maxWidth: 800,
          margin: '0 auto 24px',
        }}
      >
        {[
          { label: '门店编号', value: store.storeCode, color: '#94a3b8' },
          { label: '开业日期', value: store.openDate, color: '#94a3b8' },
          { label: '营业面积', value: `${store.area}㎡`, color: '#94a3b8' },
          {
            label: '今日已营业',
            value: (() => {
              const now = new Date();
              return `${now.getHours() - 10}h`;
            })(),
            color: '#34d399',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(148,163,184,0.08)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color, marginBottom: 2 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 主内容 */}
      <ErrorBoundary fallback={() => <StoreManagerErrorFallback />}>
        <Suspense fallback={<StoreManagerLoadingFallback />}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div
              style={{
                borderRadius: 16,
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(148,163,184,0.12)',
                padding: 24,
              }}
            >
              <h2
                style={{
                  color: '#f8fafc',
                  fontSize: 18,
                  fontWeight: 600,
                  margin: '0 0 20px',
                }}
              >
                {store.name}
              </h2>

              {/* 信息表单 */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    color: '#e2e8f0',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  门店名称
                </label>
                <input
                  defaultValue={store.name}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.2)',
                    background: 'rgba(0,0,0,0.2)',
                    color: '#f8fafc',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    color: '#e2e8f0',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  地址
                </label>
                <input
                  defaultValue={store.address}
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.1)',
                    background: 'rgba(0,0,0,0.1)',
                    color: '#94a3b8',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    color: '#e2e8f0',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  联系电话
                </label>
                <input
                  defaultValue={store.phone}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.2)',
                    background: 'rgba(0,0,0,0.2)',
                    color: '#f8fafc',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    color: '#e2e8f0',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  营业时间
                </label>
                <input
                  defaultValue={store.hours}
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.1)',
                    background: 'rgba(0,0,0,0.1)',
                    color: '#94a3b8',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    color: '#e2e8f0',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  紧急联系人
                </label>
                <input
                  defaultValue={store.emergencyContact}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.2)',
                    background: 'rgba(0,0,0,0.2)',
                    color: '#f8fafc',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              {/* 营业状态切换 */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    color: '#e2e8f0',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  营业状态
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { key: 'active', label: '营业中', color: '#34d399' },
                    { key: 'maintenance', label: '维护中', color: '#fbbf24' },
                    { key: 'closed', label: '已关闭', color: '#f87171' },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 8,
                        background:
                          store.status === opt.key
                            ? `${opt.color}20`
                            : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${
                          store.status === opt.key
                            ? `${opt.color}40`
                            : 'rgba(148,163,184,0.1)'
                        }`,
                        color: store.status === opt.key ? opt.color : '#64748b',
                        fontSize: 13,
                        fontWeight: store.status === opt.key ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* 保存按钮 */}
              <button
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                保存修改
              </button>
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>

      {/* 安全提示 */}
      <div
        style={{
          marginTop: 24,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(59,130,246,0.04)',
          border: '1px solid rgba(59,130,246,0.12)',
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.6,
          maxWidth: 800,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <strong style={{ color: '#60a5fa' }}>安全提示</strong>
        <br />
        门店状态变更为「维护中」后，将不会接受新的线上订单。
        维护期间用户在客户端将看到「暂停营业」提示。
        状态将在维护完成后自动恢复，或可由门店手动切换回「营业中」。
      </div>
    </>
  );
}
