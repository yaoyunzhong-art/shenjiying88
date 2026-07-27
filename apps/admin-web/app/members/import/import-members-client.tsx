'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { FormField, PageShell, SubmitButton, WorkspaceBreadcrumb } from '@m5/ui';

import type { ImportConfig, ImportMembersPageSnapshot, ImportProgress, ImportRecord, ImportStage } from './import-members-data';

function statusLabel(isValid: boolean): string {
  return isValid ? '通过校验' : '校验失败';
}

export default function ImportMembersClient({ snapshot }: { snapshot: ImportMembersPageSnapshot }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [stage, setStage] = useState<ImportStage>('upload');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [config, setConfig] = useState<ImportConfig>(snapshot.defaultConfig);
  const [previewData, setPreviewData] = useState<ImportRecord[]>([]);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  useEffect(() => {
    setStage('upload');
    setSelectedFileName('');
    setConfig(snapshot.defaultConfig);
    setPreviewData([]);
    setProgress(null);
  }, [snapshot]);

  const handleRefresh = useCallback(() => {
    startRefresh(() => {
      router.refresh();
    });
  }, [router, startRefresh]);

  const stats = useMemo(() => {
    const success = previewData.filter((item) => item.isValid).length;
    const failed = previewData.length - success;
    return { success, failed };
  }, [previewData]);

  const handlePreview = useCallback(async () => {
    if (!selectedFileName) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
    setPreviewData(snapshot.previewRecords);
    setStage('preview');
  }, [selectedFileName, snapshot.previewRecords]);

  const handleImport = useCallback(async () => {
    setStage('confirming');
    await new Promise((resolve) => setTimeout(resolve, 200));
    setProgress({
      total: previewData.length,
      success: stats.success,
      failed: stats.failed,
      errors: stats.failed > 0 ? [`${stats.failed} 条数据校验未通过，已跳过`] : [],
    });
    setStage('result');
  }, [previewData.length, stats.failed, stats.success]);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb workspaceLabel="会员管理" workspaceHref="/members" detailLabel="批量导入" />
      <PageShell title="批量导入会员" subtitle="上传模板文件，预览校验结果并演示导入结果聚合。">
        <div style={hintStyle}>模板字段: {snapshot.templateHeaders.join(' / ')}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 }}>
          <SubmitButton variant="secondary" onClick={handleRefresh} loading={isRefreshing}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </SubmitButton>
        </div>

        {stage === 'upload' ? (
          <div style={sectionStyle}>
            <div style={gridStyle}>
              <FormField label="导入文件">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? '')} style={{ color: '#cbd5e1' }} />
              </FormField>
              <FormField label="重复校验策略">
                <select value={config.duplicateCheck} onChange={(event) => setConfig((prev) => ({ ...prev, duplicateCheck: event.target.value as ImportConfig['duplicateCheck'] }))} style={{ ...inputStyle(false), minHeight: 40 }}>
                  <option value="phone">按手机号</option>
                  <option value="name">按姓名</option>
                  <option value="none">不校验</option>
                </select>
              </FormField>
            </div>
            <div style={actionStyle}>
              <SubmitButton variant="secondary" onClick={() => router.push('/members')}>返回列表</SubmitButton>
              <SubmitButton variant="primary" onClick={() => void handlePreview()} disabled={!selectedFileName}>解析并预览</SubmitButton>
            </div>
          </div>
        ) : null}

        {stage === 'preview' ? (
          <div style={sectionStyle}>
            <div style={{ color: '#cbd5e1', marginBottom: 16 }}>通过校验 {stats.success} 条，失败 {stats.failed} 条。</div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>行号</th>
                  <th style={thStyle}>姓名</th>
                  <th style={thStyle}>手机号</th>
                  <th style={thStyle}>等级</th>
                  <th style={thStyle}>校验</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((item) => (
                  <tr key={item.row}>
                    <td style={tdStyle}>{item.row}</td>
                    <td style={tdStyle}>{item.name || '—'}</td>
                    <td style={tdStyle}>{item.phone}</td>
                    <td style={tdStyle}>{item.tier}</td>
                    <td style={tdStyle}>{statusLabel(item.isValid)} {item.validationErrors.join(' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={actionStyle}>
              <SubmitButton variant="secondary" onClick={() => setStage('upload')}>返回上传</SubmitButton>
              <SubmitButton variant="primary" onClick={() => void handleImport()}>确认导入</SubmitButton>
            </div>
          </div>
        ) : null}

        {stage === 'confirming' ? <div style={sectionStyle}>正在汇总导入结果...</div> : null}

        {stage === 'result' && progress ? (
          <div style={sectionStyle}>
            <div style={{ color: '#cbd5e1', lineHeight: 1.8 }}>
              <div>总记录: {progress.total}</div>
              <div>成功导入: {progress.success}</div>
              <div>失败跳过: {progress.failed}</div>
              <div>{progress.errors.join('；') || '全部记录通过校验。'}</div>
            </div>
            <div style={actionStyle}>
              <SubmitButton variant="secondary" onClick={() => setStage('upload')}>重新导入</SubmitButton>
              <SubmitButton variant="primary" onClick={() => router.push('/members')}>返回会员列表</SubmitButton>
            </div>
          </div>
        ) : null}
      </PageShell>
    </div>
  );
}

const sectionStyle: CSSProperties = { borderRadius: 16, padding: 24, background: 'rgba(15, 23, 42, 0.35)', border: '1px solid rgba(148, 163, 184, 0.18)' };
const gridStyle: CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' };
const actionStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 };
const hintStyle: CSSProperties = { marginBottom: 16, borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(96, 165, 250, 0.2)', background: 'rgba(30, 41, 59, 0.45)', color: '#dbeafe', fontSize: 13 };
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: CSSProperties = { textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.18)' };
const tdStyle: CSSProperties = { padding: '12px', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid rgba(148, 163, 184, 0.08)' };
function inputStyle(hasError: boolean): CSSProperties { return { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`, background: 'rgba(15, 23, 42, 0.4)', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }; }
