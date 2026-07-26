"use client"

import type * as React from 'react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PageShell } from '@m5/ui'
import type {
  AdminSettingsSnapshot,
  MailProviderSnapshot,
  PaymentChannelSnapshot,
  SecurityPolicySnapshot,
  SmsProviderSnapshot,
  SystemInfoSnapshot,
} from './admin-settings-data'

const SECURITY_CATEGORY_LABELS: Record<SecurityPolicySnapshot['category'], string> = {
  auth: '认证安全',
  access: '访问控制',
  audit: '审计合规',
  data: '数据安全',
}

const PAYMENT_STATUS_LABELS: Record<PaymentChannelSnapshot['status'], string> = {
  normal: '正常',
  degraded: '降级',
  down: '不可用',
}

const PAYMENT_STATUS_COLORS: Record<PaymentChannelSnapshot['status'], string> = {
  normal: '#16a34a',
  degraded: '#d97706',
  down: '#dc2626',
}

const ENV_LABELS: Record<SystemInfoSnapshot['environment'], string> = {
  production: '生产环境',
  staging: '预发布',
  testing: '测试环境',
}

export default function AdminSettingsClient({ snapshot }: { snapshot: AdminSettingsSnapshot }) {
  const router = useRouter()
  const [systemInfo, setSystemInfo] = useState<SystemInfoSnapshot>(snapshot.systemInfo)
  const [smsProviders, setSmsProviders] = useState<SmsProviderSnapshot[]>(snapshot.smsProviders)
  const [mailProviders, setMailProviders] = useState<MailProviderSnapshot[]>(snapshot.mailProviders)
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannelSnapshot[]>(
    snapshot.paymentChannels,
  )
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicySnapshot[]>(
    snapshot.securityPolicies,
  )
  const [saved, setSaved] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()

  useEffect(() => {
    setSystemInfo(snapshot.systemInfo)
    setSmsProviders(snapshot.smsProviders)
    setMailProviders(snapshot.mailProviders)
    setPaymentChannels(snapshot.paymentChannels)
    setSecurityPolicies(snapshot.securityPolicies)
  }, [snapshot])

  const stats = useMemo(
    () => ({
      smsEnabled: smsProviders.filter((item) => item.enabled).length,
      mailEnabled: mailProviders.filter((item) => item.enabled).length,
      paymentEnabled: paymentChannels.filter((item) => item.enabled).length,
      securityEnabled: securityPolicies.filter((item) => item.enabled).length,
    }),
    [mailProviders, paymentChannels, securityPolicies, smsProviders],
  )

  const totalDailyVolume = useMemo(
    () => paymentChannels.reduce((sum, item) => sum + item.dailyVolume, 0),
    [paymentChannels],
  )

  const toggleSmsProvider = (id: string) => {
    setSmsProviders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    )
  }

  const toggleMailProvider = (id: string) => {
    setMailProviders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    )
  }

  const togglePaymentChannel = (id: string) => {
    setPaymentChannels((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    )
  }

  const toggleSecurityPolicy = (id: string) => {
    setSecurityPolicies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    )
  }

  const handleSave = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  const handleReset = () => {
    setSystemInfo(snapshot.systemInfo)
    setSmsProviders(snapshot.smsProviders)
    setMailProviders(snapshot.mailProviders)
    setPaymentChannels(snapshot.paymentChannels)
    setSecurityPolicies(snapshot.securityPolicies)
    setSaved(false)
  }

  return (
    <PageShell title="系统全局设置" subtitle="server wrapper + snapshot loader + client renderer">
      <main style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <h1 style={titleStyle}>全局设置</h1>
            <p style={subtitleStyle}>
              服务端首屏快照显式透出基础配置、服务通道与安全策略来源态，客户端只保留交互草稿与刷新入口。
            </p>
            <div style={metaStyle}>
              Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel} · generatedAt{' '}
              {snapshot.generatedAt}
            </div>
          </div>
          <div style={heroActionsStyle}>
            <button
              type="button"
              onClick={() => startRefresh(() => router.refresh())}
              disabled={isRefreshing}
              style={secondaryButtonStyle}
            >
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
            <button type="button" onClick={handleSave} style={primaryButtonStyle}>
              保存草稿
            </button>
            <button type="button" onClick={handleReset} style={secondaryButtonStyle}>
              重置草稿
            </button>
          </div>
        </section>

        {snapshot.error ? <section style={warningStyle}>{snapshot.error}</section> : null}

        <section style={statGridStyle}>
          <StatCard label="短信服务" value={`${stats.smsEnabled}/${smsProviders.length}`} />
          <StatCard label="邮件服务" value={`${stats.mailEnabled}/${mailProviders.length}`} />
          <StatCard label="支付通道" value={`${stats.paymentEnabled}/${paymentChannels.length}`} />
          <StatCard label="安全策略" value={`${stats.securityEnabled}/${securityPolicies.length}`} />
        </section>

        <section style={panelStyle}>
          <div style={sectionTitleStyle}>系统信息</div>
          <div style={formGridStyle}>
            <Field label="系统名称" value={systemInfo.name} />
            <Field label="运行环境" value={ENV_LABELS[systemInfo.environment]} />
            <Field label="版本 / Build" value={`${systemInfo.version} · ${systemInfo.build}`} />
            <Field label="时区 / 语言" value={`${systemInfo.timezone} · ${systemInfo.language}`} />
            <Field label="版权信息" value={systemInfo.copyright} fullWidth />
            <Field label="Logo 提示" value={systemInfo.logoHint} fullWidth />
          </div>
          {saved ? <div style={savedStyle}>草稿已保存到本地交互态，尚未提交真实配置中心。</div> : null}
        </section>

        <section style={splitGridStyle}>
          <ProviderPanel
            title="短信服务配置"
            subtitle={`已启用 ${stats.smsEnabled}/${smsProviders.length}`}
            items={smsProviders.map((item) => ({
              key: item.id,
              title: item.name,
              enabled: item.enabled,
              detail: `余额 ${item.balance.toLocaleString()} 条 · 已用 ${item.dailyUsed.toLocaleString()}/${item.dailyCap.toLocaleString()} · 优先级 ${item.priority}`,
              extra: `${item.endpoint} · ${item.apiKey}`,
              onToggle: () => toggleSmsProvider(item.id),
            }))}
          />
          <ProviderPanel
            title="邮件服务配置"
            subtitle={`已启用 ${stats.mailEnabled}/${mailProviders.length}`}
            items={mailProviders.map((item) => ({
              key: item.id,
              title: item.name,
              enabled: item.enabled,
              detail: `${item.host}:${item.port} · ${item.encryption} · 今日 ${item.dailySent}/${item.dailyLimit}`,
              extra: item.username,
              onToggle: () => toggleMailProvider(item.id),
            }))}
          />
        </section>

        <section style={panelStyle}>
          <div style={sectionHeaderRowStyle}>
            <div>
              <div style={sectionTitleStyle}>支付通道</div>
              <div style={sectionMetaStyle}>fallback 样本日交易额 {formatMoney(totalDailyVolume)}</div>
            </div>
          </div>
          <div style={listStyle}>
            {paymentChannels.map((item) => (
              <div key={item.id} style={listItemStyle}>
                <div style={listMainStyle}>
                  <div style={listTitleRowStyle}>
                    <span style={itemTitleStyle}>{item.name}</span>
                    <span
                      style={{
                        ...badgeStyle,
                        color: PAYMENT_STATUS_COLORS[item.status],
                        borderColor: `${PAYMENT_STATUS_COLORS[item.status]}33`,
                        background: `${PAYMENT_STATUS_COLORS[item.status]}11`,
                      }}
                    >
                      {PAYMENT_STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <div style={listDetailStyle}>
                    {item.provider} · 费率 {item.feeRate}% · 结算 {item.settleCycle} · 日交易额{' '}
                    {formatMoney(item.dailyVolume)}
                  </div>
                </div>
                <label style={toggleStyle}>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => togglePaymentChannel(item.id)}
                  />
                  <span>{item.enabled ? '启用' : '停用'}</span>
                </label>
              </div>
            ))}
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionTitleStyle}>安全策略</div>
          <div style={listStyle}>
            {securityPolicies.map((item) => (
              <div key={item.id} style={listItemStyle}>
                <div style={listMainStyle}>
                  <div style={listTitleRowStyle}>
                    <span style={itemTitleStyle}>{item.label}</span>
                    <span style={badgeStyle}>{SECURITY_CATEGORY_LABELS[item.category]}</span>
                  </div>
                  <div style={listDetailStyle}>{item.description}</div>
                </div>
                <label style={toggleStyle}>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => toggleSecurityPolicy(item.id)}
                  />
                  <span>{item.enabled ? '启用' : '停用'}</span>
                </label>
              </div>
            ))}
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionTitleStyle}>治理备注</div>
          <div style={noteListStyle}>
            {snapshot.governanceNotes.map((item) => (
              <div key={item} style={noteItemStyle}>
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article style={statCardStyle}>
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
    </article>
  )
}

function Field({
  label,
  value,
  fullWidth,
}: {
  label: string
  value: string
  fullWidth?: boolean
}) {
  return (
    <div style={fullWidth ? { ...fieldStyle, gridColumn: '1 / -1' } : fieldStyle}>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={fieldValueStyle}>{value}</div>
    </div>
  )
}

function ProviderPanel({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: Array<{
    key: string
    title: string
    enabled: boolean
    detail: string
    extra: string
    onToggle: () => void
  }>
}) {
  return (
    <section style={panelStyle}>
      <div style={sectionHeaderRowStyle}>
        <div>
          <div style={sectionTitleStyle}>{title}</div>
          <div style={sectionMetaStyle}>{subtitle}</div>
        </div>
      </div>
      <div style={listStyle}>
        {items.map((item) => (
          <div key={item.key} style={listItemStyle}>
            <div style={listMainStyle}>
              <div style={listTitleRowStyle}>
                <span style={itemTitleStyle}>{item.title}</span>
                <span style={badgeStyle}>{item.enabled ? '启用' : '停用'}</span>
              </div>
              <div style={listDetailStyle}>{item.detail}</div>
              <div style={listExtraStyle}>{item.extra}</div>
            </div>
            <label style={toggleStyle}>
              <input type="checkbox" checked={item.enabled} onChange={item.onToggle} />
              <span>{item.enabled ? '启用' : '停用'}</span>
            </label>
          </div>
        ))}
      </div>
    </section>
  )
}

function formatMoney(value: number) {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(1)}万`
  }
  return `¥${value.toLocaleString()}`
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
}
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' }
const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 14,
  lineHeight: 1.6,
  color: '#475569',
  maxWidth: 760,
}
const metaStyle: React.CSSProperties = { fontSize: 12, color: '#64748b' }
const heroActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid #2563eb',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
}
const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid rgba(148, 163, 184, 0.4)',
  background: '#fff',
  color: '#0f172a',
  cursor: 'pointer',
}
const warningStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(245, 158, 11, 0.3)',
  background: 'rgba(255, 247, 237, 0.9)',
  color: '#9a3412',
  fontSize: 13,
}
const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}
const statCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: '#fff',
  padding: 16,
}
const statLabelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b' }
const statValueStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 24,
  fontWeight: 700,
  color: '#0f172a',
}
const splitGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
}
const panelStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: '#fff',
  padding: 18,
}
const sectionHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 14,
}
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#0f172a',
}
const sectionMetaStyle: React.CSSProperties = { marginTop: 4, fontSize: 12, color: '#64748b' }
const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
}
const fieldStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(226, 232, 240, 0.9)',
  padding: 14,
  background: 'rgba(248, 250, 252, 0.95)',
}
const fieldLabelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b' }
const fieldValueStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  color: '#0f172a',
  lineHeight: 1.6,
}
const savedStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 13,
  color: '#047857',
}
const listStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const listItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  borderRadius: 12,
  border: '1px solid rgba(226, 232, 240, 0.9)',
  padding: 14,
  background: 'rgba(248, 250, 252, 0.95)',
}
const listMainStyle: React.CSSProperties = { display: 'grid', gap: 6, flex: 1 }
const listTitleRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }
const itemTitleStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#0f172a' }
const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: 999,
  padding: '2px 10px',
  fontSize: 12,
  color: '#475569',
}
const listDetailStyle: React.CSSProperties = { fontSize: 13, color: '#334155', lineHeight: 1.6 }
const listExtraStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', lineHeight: 1.6 }
const toggleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  color: '#475569',
  whiteSpace: 'nowrap',
}
const noteListStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const noteItemStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: '10px 12px',
  background: 'rgba(59, 130, 246, 0.08)',
  color: '#1d4ed8',
  fontSize: 13,
  lineHeight: 1.6,
}
