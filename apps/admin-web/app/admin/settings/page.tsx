// @ts-nocheck
'use client';

/**
 * 系统全局设置 - Settings Page
 * 角色: 👑超级管理员
 * 功能: 系统名称、Logo上传、短信/邮件服务、支付通道、安全策略
 */

import { useState, useEffect } from 'react';
import { PageShell, StatusBadge, Switch } from '@m5/ui';

// ============================================================
// Mock 数据
// ============================================================

interface SmsProvider {
  id: string;
  name: string;
  enabled: boolean;
  balance: number;
  dailyCap: number;
  dailyUsed: number;
  endpoint: string;
  apiKey: string;
  priority: number;
}

interface MailProvider {
  id: string;
  name: string;
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  encryption: 'SSL' | 'TLS' | 'None';
  dailyLimit: number;
  dailySent: number;
}

interface PaymentChannel {
  id: string;
  name: string;
  enabled: boolean;
  provider: string;
  feeRate: number;
  settleCycle: string;
  status: 'normal' | 'degraded' | 'down';
  dailyVolume: number;
}

interface SecurityPolicy {
  id: string;
  label: string;
  enabled: boolean;
  description: string;
  category: 'auth' | 'access' | 'audit' | 'data';
}

// ==================== 系统信息 ====================
const SYSTEM_INFO = {
  name: '神机营·运营管理系统',
  version: 'v3.8.2',
  build: '20260711.01',
  environment: 'production',
  logoUrl: '',
  favicon: '',
  copyright: '© 2026 ShenJiYing All Rights Reserved',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
};

// ==================== 短信服务商 ====================
const SMS_PROVIDERS: SmsProvider[] = [
  {
    id: 'aliyun',
    name: '阿里云短信',
    enabled: true,
    balance: 48520,
    dailyCap: 50000,
    dailyUsed: 18230,
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiKey: 'LTAI5t******示例',
    priority: 1,
  },
  {
    id: 'tencent',
    name: '腾讯云短信',
    enabled: true,
    balance: 32100,
    dailyCap: 30000,
    dailyUsed: 7560,
    endpoint: 'https://sms.tencentcloudapi.com',
    apiKey: 'AKID******示例',
    priority: 2,
  },
  {
    id: 'twilio',
    name: 'Twilio（国际）',
    enabled: false,
    balance: 1500,
    dailyCap: 10000,
    dailyUsed: 0,
    endpoint: 'https://api.twilio.com',
    apiKey: 'AC******示例',
    priority: 3,
  },
];

// ==================== 邮件服务商 ====================
const MAIL_PROVIDERS: MailProvider[] = [
  {
    id: 'sendcloud',
    name: 'SendCloud',
    enabled: true,
    host: 'smtp.sendcloud.net',
    port: 465,
    username: 'shenjiying_api',
    encryption: 'SSL',
    dailyLimit: 50000,
    dailySent: 12450,
  },
  {
    id: 'aliyun-mail',
    name: '阿里云邮件推送',
    enabled: true,
    host: 'smtpdm.aliyun.com',
    port: 465,
    username: 'noreply@shenjiying.com',
    encryption: 'TLS',
    dailyLimit: 20000,
    dailySent: 3800,
  },
];

// ==================== 支付通道 ====================
const PAYMENT_CHANNELS: PaymentChannel[] = [
  {
    id: 'wechat',
    name: '微信支付',
    enabled: true,
    provider: '财付通',
    feeRate: 0.6,
    settleCycle: 'T+1',
    status: 'normal',
    dailyVolume: 384000,
  },
  {
    id: 'alipay',
    name: '支付宝',
    enabled: true,
    provider: '蚂蚁金服',
    feeRate: 0.55,
    settleCycle: 'T+1',
    status: 'normal',
    dailyVolume: 296000,
  },
  {
    id: 'unionpay',
    name: '银联支付',
    enabled: false,
    provider: '中国银联',
    feeRate: 0.8,
    settleCycle: 'T+3',
    status: 'degraded',
    dailyVolume: 0,
  },
  {
    id: 'stripe',
    name: 'Stripe（国际）',
    enabled: false,
    provider: 'Stripe Inc.',
    feeRate: 2.9,
    settleCycle: 'T+7',
    status: 'down',
    dailyVolume: 0,
  },
];

// ==================== 安全策略 ====================
const SECURITY_POLICIES: SecurityPolicy[] = [
  {
    id: 'mfa',
    label: '强制多因素认证',
    enabled: true,
    description: '管理员登录需短信验证码+密码双重认证',
    category: 'auth',
  },
  {
    id: 'pw_policy',
    label: '密码强度策略',
    enabled: true,
    description: '密码至少12位，需含大小写字母、数字和特殊字符',
    category: 'auth',
  },
  {
    id: 'session_timeout',
    label: '会话超时限制',
    enabled: true,
    description: '管理后台30分钟无操作自动登出',
    category: 'access',
  },
  {
    id: 'ip_whitelist',
    label: 'IP白名单',
    enabled: true,
    description: '仅允许白名单IP访问管理后台',
    category: 'access',
  },
  {
    id: 'audit_log',
    label: '完整审计日志',
    enabled: true,
    description: '记录所有管理操作的详细日志，保存180天',
    category: 'audit',
  },
  {
    id: 'operation_approval',
    label: '敏感操作审批',
    enabled: true,
    description: '修改费率、提现等操作需二级管理员审批',
    category: 'audit',
  },
  {
    id: 'data_encryption',
    label: '数据加密存储',
    enabled: true,
    description: '用户敏感信息（手机号、身份证）加密存储',
    category: 'data',
  },
  {
    id: 'data_mask',
    label: '数据脱敏展示',
    enabled: true,
    description: '操作日志、报表中手机号/邮箱中间四位脱敏',
    category: 'data',
  },
  {
    id: 'api_rate_limit',
    label: 'API频率限制',
    enabled: true,
    description: '单IP每分钟最多100次API请求',
    category: 'access',
  },
  {
    id: 'geofence',
    label: '地理围栏登录',
    enabled: false,
    description: '限制仅限中国大陆IP登录',
    category: 'auth',
  },
];

const SECURITY_CATEGORY_LABELS: Record<string, string> = {
  auth: '认证安全',
  access: '访问控制',
  audit: '审计合规',
  data: '数据安全',
};

const SECURITY_CATEGORY_ICONS: Record<string, string> = {
  auth: '🔐',
  access: '🛡️',
  audit: '📋',
  data: '💾',
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger'; color: string }> = {
  normal: { label: '正常', variant: 'success', color: '#22c55e' },
  degraded: { label: '降级', variant: 'warning', color: '#eab308' },
  down: { label: '不可用', variant: 'danger', color: '#ef4444' },
};

const ENV_LABELS: Record<string, string> = {
  production: '生产环境',
  staging: '预发布',
  testing: '测试环境',
};

// ============================================================
// CSS 常量
// ============================================================
const card: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  margin: '0 0 16px',
  color: '#f1f5f9',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15,23,42,0.5)',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#cbd5e1',
  fontWeight: 500,
  marginBottom: 6,
  display: 'block',
};

const tagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
};

const btnStyle = (bg: string, color: string): React.CSSProperties => ({
  borderRadius: 10,
  padding: '10px 22px',
  background: `${bg}22`,
  color,
  border: '1px solid ' + bg + '44',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  transition: 'all 0.15s ease',
});

const divider: React.CSSProperties = {
  height: 1,
  background: 'rgba(148,163,184,0.12)',
  margin: '24px 0',
};

function formatMoney(n: number): string {
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

// ============================================================
// 组件: 系统信息编辑
// ============================================================
function SystemInfoSection() {
  const [name, setName] = useState(SYSTEM_INFO.name);
  const [env, setEnv] = useState(SYSTEM_INFO.environment);
  const [copyright, setCopyright] = useState(SYSTEM_INFO.copyright);
  const [timezone, setTimezone] = useState(SYSTEM_INFO.timezone);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={card}>
      <h3 style={sectionTitle}>
        <span style={{ fontSize: 18, marginRight: 6 }}>⚙️</span>
        系统信息
        <span style={{ fontWeight: 400, fontSize: 13, color: '#64748b', marginLeft: 8 }}>
          v{SYSTEM_INFO.version} · build {SYSTEM_INFO.build}
        </span>
      </h3>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        {/* 系统名称 */}
        <div>
          <label style={labelStyle}>系统名称</label>
          <input
            style={inputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="系统名称"
          />
        </div>

        {/* 运行环境 */}
        <div>
          <label style={labelStyle}>运行环境</label>
          <select
            style={inputStyle}
            value={env}
            onChange={e => setEnv(e.target.value)}
          >
            <option value="production">生产环境</option>
            <option value="staging">预发布</option>
            <option value="testing">测试环境</option>
          </select>
        </div>

        {/* 时区 */}
        <div>
          <label style={labelStyle}>时区</label>
          <select style={inputStyle} value={timezone} onChange={e => setTimezone(e.target.value)}>
            <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
            <option value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
            <option value="America/New_York">America/New_York (UTC-5)</option>
          </select>
        </div>

        {/* 系统语言 */}
        <div>
          <label style={labelStyle}>系统语言</label>
          <select style={inputStyle} defaultValue={SYSTEM_INFO.language}>
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="en-US">English (US)</option>
          </select>
        </div>

        {/* 版权信息 */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>版权信息</label>
          <input
            style={inputStyle}
            value={copyright}
            onChange={e => setCopyright(e.target.value)}
            placeholder="版权信息"
          />
        </div>
      </div>

      {/* Logo 上传 */}
      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.1)' }}>
        <label style={labelStyle}>Logo & Favicon</label>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 8 }}>
          {/* Logo 预览 */}
          <div
            style={{
              width: 120,
              height: 40,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(148,163,184,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 2,
            }}
          >
            SJY
          </div>
          <button style={btnStyle('#3b82f6', '#93c5fd')}>📁 上传 Logo</button>
          <button style={btnStyle('#8b5cf6', '#a78bfa')}>📁 上传 Favicon</button>
          <span style={{ fontSize: 12, color: '#64748b' }}>推荐: 240×80px, PNG/SVG</span>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <button style={{ ...btnStyle('#22c55e', '#86efac'), background: '#22c55e', color: '#052e16', border: 'none' }} onClick={handleSave}>
          💾 保存设置
        </button>
        <button style={btnStyle('#64748b', '#94a3b8')}>↩️ 重置</button>
        {saved && (
          <span style={{ ...tagStyle, background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
            ✅ 已保存
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 组件: 短信服务配置
// ============================================================
function SmsSection() {
  const [providers, setProviders] = useState(SMS_PROVIDERS);

  const toggleProvider = (id: string) => {
    setProviders(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div style={card}>
      <h3 style={sectionTitle}>
        <span style={{ fontSize: 18, marginRight: 6 }}>📱</span>
        短信服务配置
        <span style={{ fontWeight: 400, fontSize: 13, color: '#64748b', marginLeft: 8 }}>
          已启用 {providers.filter(p => p.enabled).length}/{providers.length}
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {providers.map(provider => {
          const usage = provider.dailyCap > 0 ? Math.round((provider.dailyUsed / provider.dailyCap) * 100) : 0;
          return (
            <div
              key={provider.id}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.35)',
                border: `1px solid ${provider.enabled ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.1)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{provider.name}</span>
                  <StatusBadge
                    label={provider.enabled ? '启用' : '停用'}
                    variant={provider.enabled ? 'success' : 'neutral'}
                    size="sm"
                    dot
                  />
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    优先级 {provider.priority}
                  </span>
                </div>
                <Switch
                  checked={provider.enabled}
                  onChange={() => toggleProvider(provider.id)}
                />
              </div>

              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>余额</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>
                    {provider.balance.toLocaleString()} 条
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Endpoint</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{provider.endpoint}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>API Key</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{provider.apiKey}</div>
                </div>
              </div>

              {/* 用量条 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: '#64748b', width: 60 }}>今日用量</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(usage, 100)}%`,
                      borderRadius: 3,
                      background: usage > 80 ? '#ef4444' : usage > 50 ? '#eab308' : '#22c55e',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 80, textAlign: 'right' }}>
                  {provider.dailyUsed.toLocaleString()} / {provider.dailyCap.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        <button style={btnStyle('#3b82f6', '#93c5fd')}>➕ 新增短信服务商</button>
      </div>
    </div>
  );
}

// ============================================================
// 组件: 邮件服务配置
// ============================================================
function MailSection() {
  const [providers, setProviders] = useState(MAIL_PROVIDERS);

  const toggleProvider = (id: string) => {
    setProviders(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div style={card}>
      <h3 style={sectionTitle}>
        <span style={{ fontSize: 18, marginRight: 6 }}>✉️</span>
        邮件服务配置
        <span style={{ fontWeight: 400, fontSize: 13, color: '#64748b', marginLeft: 8 }}>
          已启用 {providers.filter(p => p.enabled).length}/{providers.length}
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {providers.map(provider => {
          const usage = provider.dailyLimit > 0 ? Math.round((provider.dailySent / provider.dailyLimit) * 100) : 0;
          return (
            <div
              key={provider.id}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.35)',
                border: `1px solid ${provider.enabled ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.1)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{provider.name}</span>
                  <StatusBadge
                    label={provider.enabled ? '启用' : '停用'}
                    variant={provider.enabled ? 'success' : 'neutral'}
                    size="sm"
                    dot
                  />
                  <span
                    style={{
                      ...tagStyle,
                      background:
                        provider.encryption === 'SSL'
                          ? 'rgba(59,130,246,0.15)'
                          : 'rgba(139,92,246,0.15)',
                      color: '#93c5fd',
                      border:
                        provider.encryption === 'SSL'
                          ? '1px solid rgba(59,130,246,0.2)'
                          : '1px solid rgba(139,92,246,0.2)',
                    }}
                  >
                    {provider.encryption}
                  </span>
                </div>
                <Switch
                  checked={provider.enabled}
                  onChange={() => toggleProvider(provider.id)}
                />
              </div>

              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>SMTP 主机</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{provider.host}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>端口</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{provider.port}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>用户名</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{provider.username}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>今日发送</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>
                    {provider.dailySent.toLocaleString()} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>/ {provider.dailyLimit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 用量条 */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: '#64748b', width: 60 }}>发送率</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(usage, 100)}%`,
                      borderRadius: 3,
                      background: usage > 80 ? '#ef4444' : usage > 50 ? '#eab308' : '#22c55e',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 80, textAlign: 'right' }}>
                  {usage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        <button style={btnStyle('#3b82f6', '#93c5fd')}>➕ 新增邮件服务商</button>
      </div>
    </div>
  );
}

// ============================================================
// 组件: 支付通道配置
// ============================================================
function PaymentSection() {
  const [channels, setChannels] = useState(PAYMENT_CHANNELS);

  const toggleChannel = (id: string) => {
    setChannels(prev =>
      prev.map(c => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const totalVolume = channels.reduce((s, c) => s + c.dailyVolume, 0);

  return (
    <div style={card}>
      <h3 style={sectionTitle}>
        <span style={{ fontSize: 18, marginRight: 6 }}>💳</span>
        支付通道配置
        <span style={{ fontWeight: 400, fontSize: 13, color: '#64748b', marginLeft: 8 }}>
          日交易总额: {formatMoney(totalVolume)}
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {channels.map(channel => (
          <div
            key={channel.id}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(15,23,42,0.35)',
              border: `1px solid ${channel.enabled ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.1)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{channel.name}</span>
                <StatusBadge label={PAYMENT_STATUS_CONFIG[channel.status].label} variant={PAYMENT_STATUS_CONFIG[channel.status].variant} size="sm" dot />
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {channel.provider} · 费率 {channel.feeRate}%
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  结算 {channel.settleCycle}
                </span>
              </div>
              <Switch
                checked={channel.enabled}
                onChange={() => toggleChannel(channel.id)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>
                日交易额: <strong style={{ color: '#22c55e' }}>{formatMoney(channel.dailyVolume)}</strong>
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...styles.smBtn, ...styles.editBtn }}>编辑</button>
                <button style={{ ...styles.smBtn, ...styles.testBtn }}>测试通道</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 组件: 安全策略设置
// ============================================================
function SecuritySection() {
  const [policies, setPolicies] = useState(SECURITY_POLICIES);

  const togglePolicy = (id: string) => {
    setPolicies(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const categories = [...new Set(policies.map(p => p.category))];

  return (
    <div style={card}>
      <h3 style={sectionTitle}>
        <span style={{ fontSize: 18, marginRight: 6 }}>🛡️</span>
        安全策略设置
        <span style={{ fontWeight: 400, fontSize: 13, color: '#64748b', marginLeft: 8 }}>
          {policies.filter(p => p.enabled).length}/{policies.length} 项已启用
        </span>
      </h3>

      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#93c5fd',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{SECURITY_CATEGORY_ICONS[cat]}</span>
            {SECURITY_CATEGORY_LABELS[cat]}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {policies
              .filter(p => p.category === cat)
              .map(policy => (
                <div
                  key={policy.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(15,23,42,0.3)',
                    border: '1px solid rgba(148,163,184,0.08)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                      {policy.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{policy.description}</div>
                  </div>
                  <Switch
                    checked={policy.enabled}
                    onChange={() => togglePolicy(policy.id)}
                  />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {};

styles.smBtn = {
  padding: '6px 12px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  border: '1px solid transparent',
} as React.CSSProperties;

styles.editBtn = {
  background: 'rgba(59,130,246,0.15)',
  color: '#93c5fd',
  border: '1px solid rgba(59,130,246,0.2)',
} as React.CSSProperties;

styles.testBtn = {
  background: 'rgba(139,92,246,0.15)',
  color: '#a78bfa',
  border: '1px solid rgba(139,92,246,0.2)',
} as React.CSSProperties;

// ============================================================
// 主页面
// ============================================================

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<boolean>(false);

  useEffect(() => {
    try {
      setData(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>加载中...</div></main>;
  if (error) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#ef4444', textAlign: 'center', padding: 64 }}>数据获取失败: {error}</div></main>;
  if (!data) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>暂无数据</div></main>;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell title="系统全局设置" subtitle="基础配置 · 服务通道 · 安全策略">
        {/* 系统信息 */}
        <div style={{ marginBottom: 20 }}><SystemInfoSection /></div>
        <div style={divider} />

        {/* 短信服务 */}
        <div style={{ marginBottom: 20 }}><SmsSection /></div>
        <div style={divider} />

        {/* 邮件服务 */}
        <div style={{ marginBottom: 20 }}><MailSection /></div>
        <div style={divider} />

        {/* 支付通道 */}
        <div style={{ marginBottom: 20 }}><PaymentSection /></div>
        <div style={divider} />

        {/* 安全策略 */}
        <SecuritySection />
      </PageShell>
    </main>
  );
}
