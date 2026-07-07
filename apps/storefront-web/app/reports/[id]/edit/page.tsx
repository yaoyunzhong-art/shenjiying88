/**
 * 销售报表编辑页 — Report Edit Form Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 * 功能: 编辑报表标题/摘要/指标，表单验证，提交，错误处理，预览
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

/* ── 报表类型定义 ── */
type ReportStatus = 'generated' | 'generating' | 'failed' | 'expired';

const REPORT_TYPE_OPTIONS = [
  { value: 'daily', label: '日报' },
  { value: 'weekly', label: '周报' },
  { value: 'monthly', label: '月报' },
  { value: 'quarterly', label: '季报' },
  { value: 'yearly', label: '年报' },
  { value: 'custom', label: '自定义' },
] as const;

type ReportTypeValue = (typeof REPORT_TYPE_OPTIONS)[number]['value'];

/* ── 报表 Mock 数据 ── */
const MOCK_REPORTS: Record<string, {
  id: string; title: string; type: ReportTypeValue;
  period: string; createdAt: string; status: ReportStatus;
  summary: string; notes: string;
  metrics?: Record<string, string | number>;
}> = {
  '1': {
    id: '1', title: '2026年6月25日销售日活报表', type: 'daily',
    period: '2026-06-25', createdAt: '2026-06-26 00:15', status: 'generated',
    summary: '本日销售额 ¥12,580.00，环比昨日 +8.3%，客单价 ¥286.00，成交单数 44 单。',
    notes: '每日自动生成',
    metrics: { '销售额': '¥12,580.00', '客单价': '¥286.00', '订单数': '44', '转化率': '8.3%' },
  },
  '2': {
    id: '2', title: '2026年第26周销售周报', type: 'weekly',
    period: '2026 W26', createdAt: '2026-06-22 00:20', status: 'generated',
    summary: '本周销售额 ¥72,360.00，环比上周 +5.1%，热销品类：护肤品、彩妆。',
    notes: '每周一凌晨自动生成',
    metrics: { '销售额': '¥72,360.00', '热销品类': '护肤品、彩妆', '订单数': '253', '客单价': '¥286.00' },
  },
  '4': {
    id: '4', title: '2026年Q2季度销售报告', type: 'quarterly',
    period: '2026 Q2', createdAt: '2026-06-01 02:00', status: 'failed',
    summary: '上季度数据汇总异常，部分门店数据未同步，请重新生成。',
    notes: '',
    metrics: {},
  },
  '6': {
    id: '6', title: '618大促活动销售分析', type: 'custom',
    period: '2026-06-18 ~ 2026-06-20', createdAt: '2026-06-21 10:30', status: 'generated',
    summary: '618大促3日累计销售额 ¥85,200.00，同比去年618 +22.5%。',
    notes: '大促专属分析报告',
    metrics: { '累计销售额': '¥85,200.00', '同比去年618': '+22.5%', '订单数': '298' },
  },
};

/* ── 可编辑指标键的元数据 ── */
interface MetricMeta {
  key: string;
  label: string;
  editable: boolean;
}

const METRIC_META: MetricMeta[] = [
  { key: '销售额', label: '销售额 (¥)', editable: true },
  { key: '客单价', label: '客单价 (¥)', editable: true },
  { key: '订单数', label: '订单数', editable: true },
  { key: '转化率', label: '转化率 (%)', editable: true },
  { key: '环比昨日', label: '环比昨日 (%)', editable: true },
  { key: '同比上周', label: '同比上周 (%)', editable: true },
  { key: '同比去年618', label: '同比去年618 (%)', editable: true },
  { key: '热销品类', label: '热销品类', editable: true },
  { key: '累计销售额', label: '累计销售额 (¥)', editable: true },
  { key: '同比增长', label: '同比增长 (%)', editable: true },
  { key: '达成率', label: '达成率 (%)', editable: true },
  { key: '新增会员', label: '新增会员', editable: true },
  { key: '总销售额', label: '总销售额 (¥)', editable: true },
];

/* ── 表单数据接口 ── */
interface EditFormData {
  title: string;
  type: ReportTypeValue;
  period: string;
  summary: string;
  notes: string;
  metrics: Record<string, string>;
  newMetricKey: string;
  newMetricValue: string;
}

/* ── 表单错误 ── */
interface FormErrors {
  title?: string;
  type?: string;
  period?: string;
  summary?: string;
}

/* ── 验证 ── */
function validateEditForm(data: EditFormData): FormErrors {
  const errors: FormErrors = {};
  const title = (data.title || '').trim();
  if (!title) errors.title = '请输入报表标题';
  else if (title.length < 2) errors.title = '标题至少2个字符';
  else if (title.length > 60) errors.title = '标题不能超过60个字符';

  if (!data.type) errors.type = '请选择报表类型';

  const period = (data.period || '').trim();
  if (!period) errors.period = '请填写报表周期';

  const summary = (data.summary || '').trim();
  if (!summary) errors.summary = '请输入报表摘要';
  else if (summary.length > 500) errors.summary = '摘要不能超过500个字符';

  return errors;
}

/* ── 模拟提交 ── */
async function saveReport(_data: EditFormData, _id: string): Promise<{ success: boolean; error?: string }> {
  await new Promise(r => setTimeout(r, 600));
  return { success: true };
}

/* ── 样式 ── */
const S: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px' },
  backLink: { color: '#2563eb', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'inline-block', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  subtitle: { fontSize: 13, color: '#6b7280', margin: '0 0 24px' },
  section: { padding: 20, borderRadius: 12, background: '#f9fafb', border: '1px solid #e5e7eb', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 16px' },
  formGroup: { marginBottom: 18 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  required: { color: '#dc2626', marginLeft: 2 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' },
  inputErr: { borderColor: '#dc2626' },
  textarea: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, color: '#111827', background: '#fff', outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, color: '#111827', background: '#fff', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  errText: { color: '#dc2626', fontSize: 12, marginTop: 4 },
  hint: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  actions: { display: 'flex', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e7eb' },
  btnPrimary: { padding: '10px 28px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnSecondary: { padding: '10px 28px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 500, fontSize: 14, cursor: 'pointer' },
  btnDanger: { padding: '8px 16px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fef2f2', color: '#991b1b', fontWeight: 500, fontSize: 13, cursor: 'pointer' },
  feedbackBox: { padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 20 },
  metricGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  metricCard: { padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb' },
  metricLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  metricInput: { width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' },
  addMetricRow: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 },
  tag: { display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  previewCard: { padding: 16, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', marginTop: 16 },
};

/* ================================================================ */

export default function ReportsEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const original = MOCK_REPORTS[id];

  const [form, setForm] = useState<EditFormData>(() => {
    const m: Record<string, string> = {};
    if (original?.metrics) {
      Object.entries(original.metrics).forEach(([k, v]) => { m[k] = String(v); });
    }
    return {
      title: original?.title || '',
      type: original?.type || ('' as ReportTypeValue),
      period: original?.period || '',
      summary: original?.summary || '',
      notes: original?.notes || '',
      metrics: m,
      newMetricKey: '',
      newMetricValue: '',
    };
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleField = useCallback(<K extends keyof EditFormData>(field: K, value: EditFormData[K]) => {
    setForm(p => ({ ...p, [field]: value }));
    if (field in errors) setErrors(p => { const r = { ...p }; delete (r as any)[field]; return r; });
    setFeedback(null);
  }, [errors]);

  const handleMetricChange = useCallback((key: string, value: string) => {
    setForm(p => ({ ...p, metrics: { ...p.metrics, [key]: value } }));
  }, []);

  const handleAddMetric = useCallback(() => {
    const k = form.newMetricKey.trim();
    const v = form.newMetricValue.trim();
    if (!k || !v) return;
    setForm(p => ({
      ...p,
      metrics: { ...p.metrics, [k]: v },
      newMetricKey: '',
      newMetricValue: '',
    }));
  }, [form.newMetricKey, form.newMetricValue]);

  const handleRemoveMetric = useCallback((key: string) => {
    setForm(p => {
      const next = { ...p.metrics };
      delete next[key];
      return { ...p, metrics: next };
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const v = validateEditForm(form);
    if (Object.keys(v).length > 0) { setErrors(v); return; }

    setSubmitting(true);
    try {
      const r = await saveReport(form, id);
      if (r.success) {
        setFeedback({ type: 'success', message: '✅ 报表信息已更新！' });
        setTimeout(() => router.push(`/reports/${id}`), 1200);
      } else {
        setFeedback({ type: 'error', message: r.error || '保存失败，请重试' });
      }
    } catch {
      setFeedback({ type: 'error', message: '提交异常，请检查网络' });
    } finally {
      setSubmitting(false);
    }
  }, [form, id, router]);

  /* 未找到报表 */
  if (!original) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>报表未找到</h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
          未找到 ID 为 <strong>{id}</strong> 的销售报表
        </p>
        <button
          onClick={() => router.push('/reports')}
          style={{
            padding: '10px 24px', borderRadius: 8, border: '1px solid #d1d5db',
            background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
          data-testid="report-edit-notfound-back"
        >
          ← 返回报表列表
        </button>
      </div>
    );
  }

  const statusColor = original.status === 'generated' ? '#059669'
    : original.status === 'generating' ? '#d97706'
    : original.status === 'failed' ? '#dc2626' : '#6b7280';
  const statusLabel = original.status === 'generated' ? '已生成'
    : original.status === 'generating' ? '生成中'
    : original.status === 'failed' ? '失败' : '已过期';

  const field: <K extends keyof EditFormData>(k: K) => { value: EditFormData[K]; onChange: (v: EditFormData[K]) => void } = (k) => ({
    value: form[k],
    onChange: (v: any) => handleField(k, v),
  });

  return (
    <div style={S.container} data-testid="report-edit-page">
      {/* 面包屑 */}
      <div style={{ marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
        <a href="/reports" style={{ color: '#2563eb', textDecoration: 'none' }}>📊 销售报表</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <a href={`/reports/${id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{original.title}</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#374151' }}>编辑</span>
      </div>

      <h1 style={S.title}>✏️ 编辑报表</h1>
      <p style={S.subtitle}>修改报表信息并保存更新</p>

      {/* 状态提示条 */}
      <div style={{
        ...S.section, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
        background: '#f0fdf4', borderColor: '#bbf7d0',
      }}>
        <span style={S.sectionTitle}>当前状态：
          <span style={{ ...S.tag, background: statusColor + '20', color: statusColor }}>{statusLabel}</span>
        </span>
      </div>

      {/* 反馈 */}
      {feedback && (
        <div style={{
          ...S.feedbackBox,
          ...(feedback.type === 'success' ? { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' } : { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }),
        }}>
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* 基本信息 */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>基本信息</h2>

          <div style={S.formGroup}>
            <label style={S.label}>报表标题<span style={S.required}>*</span></label>
            <input
              style={{ ...S.input, ...(errors.title ? S.inputErr : {}) }}
              type="text"
              placeholder="输入报表标题"
              value={form.title}
              onChange={e => field('title').onChange(e.target.value)}
              maxLength={60}
              disabled={submitting}
              data-testid="report-edit-title"
            />
            {errors.title && <div style={S.errText}>{errors.title}</div>}
            <div style={S.hint}>{form.title.length}/60 字符</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={S.formGroup}>
              <label style={S.label}>报表类型<span style={S.required}>*</span></label>
              <select
                style={{ ...S.select, ...(errors.type ? S.inputErr : {}) }}
                value={form.type}
                onChange={e => field('type').onChange(e.target.value as ReportTypeValue)}
                disabled={submitting}
                data-testid="report-edit-type"
              >
                {REPORT_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.type && <div style={S.errText}>{errors.type}</div>}
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>报表周期<span style={S.required}>*</span></label>
              <input
                style={{ ...S.input, ...(errors.period ? S.inputErr : {}) }}
                type="text"
                placeholder="例：2026-07"
                value={form.period}
                onChange={e => field('period').onChange(e.target.value)}
                maxLength={50}
                disabled={submitting}
                data-testid="report-edit-period"
              />
              {errors.period && <div style={S.errText}>{errors.period}</div>}
            </div>
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>报表摘要<span style={S.required}>*</span></label>
            <textarea
              style={{ ...S.textarea, ...(errors.summary ? S.inputErr : {}) }}
              placeholder="输入报表摘要内容"
              value={form.summary}
              onChange={e => field('summary').onChange(e.target.value)}
              maxLength={500}
              disabled={submitting}
              data-testid="report-edit-summary"
            />
            {errors.summary && <div style={S.errText}>{errors.summary}</div>}
            <div style={S.hint}>{form.summary.length}/500 字符</div>
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>备注</label>
            <textarea
              style={S.textarea}
              placeholder="可选备注"
              value={form.notes}
              onChange={e => field('notes').onChange(e.target.value)}
              maxLength={200}
              disabled={submitting}
              data-testid="report-edit-notes"
            />
            <div style={S.hint}>{form.notes.length}/200 字符（可选）</div>
          </div>
        </div>

        {/* 指标编辑 */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>指标数据</h2>
          <div style={S.metricGrid}>
            {Object.entries(form.metrics).map(([key, value]) => {
              const meta = METRIC_META.find(m => m.key === key);
              return (
                <div key={key} style={S.metricCard} data-testid={`report-edit-metric-${key}`}>
                  <div style={S.metricLabel}>{meta?.label || key}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      style={S.metricInput}
                      value={value}
                      onChange={e => handleMetricChange(key, e.target.value)}
                      disabled={submitting}
                      data-testid={`report-edit-metric-input-${key}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMetric(key)}
                      style={S.btnDanger}
                      data-testid={`report-edit-metric-remove-${key}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 添加新指标 */}
          <div style={S.addMetricRow} data-testid="report-edit-add-metric">
            <input
              style={{ ...S.input, maxWidth: 200 }}
              placeholder="指标名称"
              value={form.newMetricKey}
              onChange={e => handleField('newMetricKey', e.target.value)}
              disabled={submitting}
              data-testid="report-edit-metric-new-key"
            />
            <input
              style={{ ...S.input, maxWidth: 160 }}
              placeholder="数值"
              value={form.newMetricValue}
              onChange={e => handleField('newMetricValue', e.target.value)}
              disabled={submitting}
              data-testid="report-edit-metric-new-value"
            />
            <button
              type="button"
              onClick={handleAddMetric}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db',
                background: '#f9fafb', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
              disabled={submitting}
              data-testid="report-edit-metric-add-btn"
            >
              ➕ 添加指标
            </button>
          </div>
        </div>

        {/* 预览切换 */}
        <div style={S.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ ...S.sectionTitle, margin: 0 }}>预览</h2>
            <button
              type="button"
              onClick={() => setShowPreview(v => !v)}
              style={S.btnSecondary}
              data-testid="report-edit-preview-toggle"
            >
              {showPreview ? '收起预览' : '展开预览'}
            </button>
          </div>
          {showPreview && (
            <div style={S.previewCard} data-testid="report-edit-preview">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                {form.title || '(未命名报表)'}
              </h3>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                {form.type ? REPORT_TYPE_OPTIONS.find(o => o.value === form.type)?.label || form.type : '(未选择类型)'}
                <span style={{ margin: '0 8px' }}>·</span>
                {form.period || '(未填写周期)'}
              </div>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 12px' }}>
                {form.summary || '(无摘要)'}
              </p>
              {Object.keys(form.metrics).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                  {Object.entries(form.metrics).map(([k, v]) => (
                    <div key={k} style={{ padding: 8, borderRadius: 6, background: '#f3f4f6', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{k}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div style={S.actions}>
          <button
            type="submit"
            style={{ ...S.btnPrimary, opacity: submitting ? 0.5 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            disabled={submitting}
            data-testid="report-edit-submit"
          >
            {submitting ? '⏳ 保存中...' : '💾 保存修改'}
          </button>
          <button
            type="button"
            style={S.btnSecondary}
            onClick={() => router.push(`/reports/${id}`)}
            disabled={submitting}
            data-testid="report-edit-cancel"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
