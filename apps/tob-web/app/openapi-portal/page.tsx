'use client';

import React, { useState } from 'react';
import { Heartbeat } from './components/Heartbeat';

// API 分类数据
const API_CATEGORIES = [
  {
    id: 'order',
    name: '订单 API',
    prefix: 'order.*',
    description: '订单创建、查询、取消、退款等全生命周期管理',
    endpointCount: 24,
    icon: '📦',
    color: '#3b82f6',
  },
  {
    id: 'points',
    name: '积分 API',
    prefix: 'points.*',
    description: '积分查询、增减、兑换规则配置',
    endpointCount: 12,
    icon: '🎯',
    color: '#22c55e',
  },
  {
    id: 'coupon',
    name: '优惠券 API',
    prefix: 'coupon.*',
    description: '优惠券发放、领取、使用、退还',
    endpointCount: 18,
    icon: '🎫',
    color: '#f59e0b',
  },
  {
    id: 'inventory',
    name: '库存 API',
    prefix: 'inventory.*',
    description: '实时库存查询、锁定、释放、调拨',
    endpointCount: 15,
    icon: '📊',
    color: '#8b5cf6',
  },
  {
    id: 'user',
    name: '用户 API',
    prefix: 'user.*',
    description: '用户信息、会员等级、行为分析',
    endpointCount: 20,
    icon: '👤',
    color: '#ec4899',
  },
  {
    id: 'payment',
    name: '支付 API',
    prefix: 'payment.*',
    description: '支付通道、退款、资金流水',
    endpointCount: 16,
    icon: '💳',
    color: '#14b8a6',
  },
];

// SDK 数据
const SDK_LIST = [
  {
    id: 'nodejs',
    name: 'Node.js',
    logo: '🟢',
    installCommand: 'npm install @shenjiying/sdk-node',
    docUrl: '/docs/sdk/nodejs',
  },
  {
    id: 'python',
    name: 'Python',
    logo: '🐍',
    installCommand: 'pip install shenjiying-sdk',
    docUrl: '/docs/sdk/python',
  },
  {
    id: 'java',
    name: 'Java',
    logo: '☕',
    installCommand: 'mvn dependency:shenjiying-sdk',
    docUrl: '/docs/sdk/java',
  },
  {
    id: 'go',
    name: 'Go',
    logo: '🔵',
    installCommand: 'go get github.com/shenjiying/sdk-go',
    docUrl: '/docs/sdk/go',
  },
];

// 导航栏
function Navbar() {
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        background: 'rgba(15,23,42,0.95)',
        borderBottom: '1px solid rgba(148,163,184,0.12)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          神
        </div>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc' }}>神机营</span>
        <span style={{ fontSize: 14, color: '#64748b', marginLeft: 8 }}>OpenAPI</span>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <a href="#docs" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>文档</a>
        <a href="#console" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>调试台</a>
        <a href="#sdk" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>SDK</a>
        <a href="#apply" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>申请Key</a>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section
      style={{
        padding: '80px 32px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(59,130,246,0.1) 0%, transparent 100%)',
      }}
    >
      <h1 style={{ fontSize: 42, fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
        OpenAPI 开发者门户
      </h1>
      <p style={{ fontSize: 18, color: '#94a3b8', margin: '0 0 32px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
        连接神机营生态，打造个性化应用
      </p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <a
          href="#docs"
          style={{
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          查看文档
        </a>
        <a
          href="#apply"
          style={{
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 8,
            background: 'rgba(148,163,184,0.1)',
            color: '#e2e8f0',
            textDecoration: 'none',
            border: '1px solid rgba(148,163,184,0.2)',
          }}
        >
          申请 API Key
        </a>
      </div>
    </section>
  );
}

// API 分类卡片
function APICategoryCard({ category }: { category: typeof API_CATEGORIES[0] }) {
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 20,
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            background: `linear-gradient(135deg, ${category.color}, ${category.color}88)`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          {category.icon}
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: 0 }}>{category.name}</h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>{category.prefix}</span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
        {category.description}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>{category.endpointCount} 端点</span>
        <a
          href={`#docs-${category.id}`}
          style={{
            fontSize: 12,
            color: category.color,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          查看文档 →
        </a>
      </div>
    </div>
  );
}

// 在线调试台
function InteractiveConsole() {
  const [endpoint, setEndpoint] = useState('/api/v1/order/list');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('Authorization: Bearer YOUR_TOKEN\nContent-Type: application/json');
  const [body, setBody] = useState('{\n  "page": 1,\n  "pageSize": 20\n}');
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    // 模拟请求
    await new Promise(resolve => setTimeout(resolve, 800));
    setResponse({
      status: 200,
      body: JSON.stringify(
        {
          code: 0,
          message: 'success',
          data: {
            list: [
              { orderId: 'ORD-20240101-001', amount: 299.00, status: 'completed' },
              { orderId: 'ORD-20240101-002', amount: 159.00, status: 'pending' },
            ],
            pagination: { page: 1, pageSize: 20, total: 156 },
          },
        },
        null,
        2
      ),
    });
    setLoading(false);
  };

  const methodColors: Record<string, string> = {
    GET: '#22c55e',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    DELETE: '#ef4444',
  };

  return (
    <div
      id="console"
      style={{
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
        在线调试台
      </h2>

      {/* 请求行 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select
          value={method}
          onChange={e => setMethod(e.target.value)}
          style={{
            padding: '10px 12px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.9)',
            color: methodColors[method],
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={endpoint}
          onChange={e => setEndpoint(e.target.value)}
          placeholder="/api/v1/order/list"
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 13,
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.9)',
            color: '#e2e8f0',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: '10px 24px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 6,
            background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '发送中...' : '发送请求'}
        </button>
      </div>

      {/* Headers */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Headers</label>
        <textarea
          value={headers}
          onChange={e => setHeaders(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: 10,
            fontSize: 12,
            fontFamily: 'monospace',
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.9)',
            color: '#e2e8f0',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Body */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Request Body</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={5}
          style={{
            width: '100%',
            padding: 10,
            fontSize: 12,
            fontFamily: 'monospace',
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.9)',
            color: '#e2e8f0',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Response */}
      <div>
        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Response</label>
        {response ? (
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 6,
              padding: 16,
              border: `1px solid ${response.status === 200 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: response.status === 200 ? '#22c55e' : '#ef4444',
                marginBottom: 12,
              }}
            >
              Status: {response.status}
            </div>
            <pre
              style={{
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#94a3b8',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {response.body}
            </pre>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 6,
              padding: 32,
              textAlign: 'center',
              color: '#64748b',
              fontSize: 13,
            }}
          >
            点击「发送请求」查看响应
          </div>
        )}
      </div>
    </div>
  );
}

// SDK 下载区
function SDKSection() {
  return (
    <div id="sdk" style={{ marginTop: 48 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f8fafc', margin: '0 0 24px' }}>
        多语言 SDK
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {SDK_LIST.map(sdk => (
          <div
            key={sdk.id}
            style={{
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>{sdk.logo}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>{sdk.name}</span>
            </div>
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#94a3b8',
                marginBottom: 16,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {sdk.installCommand}
            </div>
            <a
              href={sdk.docUrl}
              style={{
                fontSize: 13,
                color: '#60a5fa',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              查看文档 →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// API Key 申请区
function APIKeyApplication() {
  const [appName, setAppName] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [purpose, setPurpose] = useState('order');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 模拟提交
    setSubmitted(true);
  };

  return (
    <div
      id="apply"
      style={{
        marginTop: 48,
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 32,
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f8fafc', margin: '0 0 8px' }}>
        获取您的 API Key
      </h2>
      <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 24px' }}>
        填写以下信息，我们将为您生成专属的 API 访问凭证
      </p>

      {submitted ? (
        <div
          style={{
            textAlign: 'center',
            padding: 32,
            background: 'rgba(34,197,94,0.1)',
            borderRadius: 8,
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#22c55e', margin: '0 0 8px' }}>
            申请已提交
          </h3>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            我们将在 1-2 个工作日内完成审核，请留意邮箱通知
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              应用名称
            </label>
            <input
              type="text"
              value={appName}
              onChange={e => setAppName(e.target.value)}
              placeholder="例如：我的电商应用"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 14,
                borderRadius: 6,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(15,23,42,0.9)',
                color: '#e2e8f0',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              应用描述
            </label>
            <textarea
              value={appDesc}
              onChange={e => setAppDesc(e.target.value)}
              placeholder="简要描述您的应用功能和使用场景"
              rows={3}
              required
              style={{
                width: '100%',
                padding: 10,
                fontSize: 14,
                borderRadius: 6,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(15,23,42,0.9)',
                color: '#e2e8f0',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              所需权限
            </label>
            <select
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 14,
                borderRadius: 6,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(15,23,42,0.9)',
                color: '#e2e8f0',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="order">仅订单 API</option>
              <option value="points">仅积分 API</option>
              <option value="coupon">仅优惠券 API</option>
              <option value="full">全功能权限</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            申请 API Key
          </button>
        </form>
      )}
    </div>
  );
}

// Footer
function Footer() {
  return (
    <footer
      style={{
        marginTop: 80,
        padding: '32px',
        borderTop: '1px solid rgba(148,163,184,0.12)',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 16 }}>
        <a href="#" style={{ fontSize: 13, color: '#60a5fa', textDecoration: 'none' }}>API 状态</a>
        <a href="#" style={{ fontSize: 13, color: '#60a5fa', textDecoration: 'none' }}>文档</a>
        <a href="#" style={{ fontSize: 13, color: '#60a5fa', textDecoration: 'none' }}>联系支持</a>
      </div>
      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
        API Version: v1.0.0 | 联系邮箱: api@shenjiying.com
      </p>
    </footer>
  );
}

// 主页面
export default function OpenAPIPortalPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Navbar />
      <HeroSection />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {/* API 分类卡片 */}
        <section id="docs" style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f8fafc', margin: '0 0 24px' }}>
            API 模块
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {API_CATEGORIES.map(category => (
              <APICategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* 在线调试台 */}
        <div style={{ marginTop: 48 }}>
          <InteractiveConsole />
        </div>

        {/* SDK 下载区 */}
        <SDKSection />

        {/* API Key 申请区 */}
        <APIKeyApplication />
      </main>

      <Footer />

      {/* HEARTBEAT-66 探针 */}
      <Heartbeat id="HEARTBEAT-66" />
    </div>
  );
}
