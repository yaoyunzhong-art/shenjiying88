'use client';

import { useCallback, useMemo } from 'react';
import type { DetailActionBarAction } from '@m5/ui';
import { recordsToCsv } from './flatten-for-csv';
import { sanitizeFilename } from './sanitize-filename';

export interface UseDetailActionsOptions {
  /** Workspace name, used in the export filename. */
  workspace: string;
  /** Detail identifier (record id / key). */
  detailId: string;
  /** Record data to be exported as JSON. */
  record: unknown;
  /** Optional title used in the share dialog. */
  shareTitle?: string;
  /** Optional text used in the share dialog. */
  shareText?: string;
  /**
   * When false, skip the optional PDF/CSV/JSON actions. Default is true
   * (everything enabled). Set to false for lightweight pages where
   * exporting is overkill.
   */
  enableExports?: boolean;
}

export interface UseDetailActionsResult {
  actions: DetailActionBarAction[];
  exportFilename: string;
}

/**
 * useDetailActions returns the standard set of "收口动作" for a detail page:
 *
 * - 复制深链 (copy current page URL to clipboard)
 * - 复制审计深链 (copy the audit deep-link URL to clipboard)
 * - 导出 JSON (download the current record as JSON)
 * - 导出 CSV (download a flattened CSV view of the record)
 * - 导出 PDF (trigger browser print, which most users can route to PDF)
 * - 分享 (use navigator.share if available, fallback to copy URL)
 * - 打印 (window.print)
 *
 * All actions are SSR-safe — handlers bail out cleanly on the server.
 */
export function useDetailActions(options: UseDetailActionsOptions): UseDetailActionsResult {
  const { workspace, detailId, record, shareTitle, shareText, enableExports = true } = options;

  const exportFilename = useMemo(() => {
    return `${sanitizeFilename(workspace)}-${sanitizeFilename(detailId)}-export`;
  }, [workspace, detailId]);

  const buildFilename = useCallback(
    (ext: string) => `${exportFilename}.${ext}`,
    [exportFilename]
  );

  const handleCopyLink = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    }
  }, []);

  const handleCopyAuditLink = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }
    // The audit trail page accepts a `?focus=source:purpose` query; provide
    // a sensible default that anchors to the current detail.
    const url = new URL(window.location.href);
    const focus = `${workspace}:${detailId}`;
    const auditUrl = `${url.origin}/audit-trail?focus=${encodeURIComponent(focus)}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(auditUrl);
    }
  }, [workspace, detailId]);

  const handleCopyRecord = useCallback(async () => {
    if (typeof window === 'undefined' || record == null) {
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    }
  }, [record]);

  const handleExportJson = useCallback(() => {
    if (typeof window === 'undefined' || record == null) {
      return;
    }
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    triggerDownload(blob, buildFilename('json'));
  }, [record, buildFilename]);

  const handleExportCsv = useCallback(() => {
    if (typeof window === 'undefined' || record == null) {
      return;
    }
    const csv = recordsToCsv(record);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, buildFilename('csv'));
  }, [record, buildFilename]);

  const handleExportPdf = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    // Most browsers allow "Save as PDF" from the print dialog. We don't
    // bundle a heavyweight PDF library; the print-to-PDF path is enough
    // for admin export use cases.
    window.print();
  }, []);

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const url = window.location.href;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({
          title: shareTitle ?? `${workspace} 详情 ${detailId}`,
          text: shareText ?? '查看此详情',
          url
        });
        return;
      } catch {
        // user cancelled or share failed; fall through to clipboard copy
      }
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    }
  }, [workspace, detailId, shareTitle, shareText]);

  const handlePrint = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.print();
  }, []);

  const actions: DetailActionBarAction[] = [
    {
      key: 'copy-link',
      label: '复制深链',
      icon: 'link' as const,
      onClick: handleCopyLink,
      successToast: { message: '深链已复制' },
      description: '复制当前页面 URL 到剪贴板'
    },
    {
      key: 'copy-audit-link',
      label: '复制审计深链',
      icon: 'copy' as const,
      onClick: handleCopyAuditLink,
      successToast: { message: '审计深链已复制' },
      description: '复制 /audit-trail?focus=... 形式的深链'
    },
    {
      key: 'copy-record',
      label: '复制记录',
      icon: 'copy' as const,
      onClick: handleCopyRecord,
      successToast: { message: '记录 JSON 已复制到剪贴板' },
      description: '把当前记录 JSON 复制到剪贴板（方便贴到工单/文档）'
    },
    ...(enableExports
      ? [
          {
            key: 'export-json',
            label: '导出 JSON',
            icon: 'export' as const,
            variant: 'primary' as const,
            onClick: handleExportJson,
            successToast: { message: 'JSON 已下载' },
            description: '下载当前记录的 JSON 快照'
          },
          {
            key: 'export-csv',
            label: '导出 CSV',
            icon: 'download' as const,
            onClick: handleExportCsv,
            successToast: { message: 'CSV 已下载' },
            description: '下载当前记录的 CSV 快照（扁平化）'
          },
          {
            key: 'export-pdf',
            label: '导出 PDF',
            icon: 'print' as const,
            onClick: handleExportPdf,
            successToast: { message: '已打开打印对话框，可另存为 PDF' },
            description: '通过浏览器打印对话框另存为 PDF'
          }
        ]
      : []),
    {
      key: 'share',
      label: '分享',
      icon: 'share' as const,
      onClick: handleShare,
      successToast: { message: '已分享' },
      description: '使用系统分享或复制 URL 到剪贴板'
    },
    {
      key: 'print',
      label: '打印',
      icon: 'print' as const,
      onClick: handlePrint,
      successToast: { message: '已发送打印任务' },
      description: '使用浏览器打印当前页面'
    }
  ];

  return { actions, exportFilename };
}

/**
 * 触发浏览器下载一个 Blob 内容。用 <a download> 实现，SSR-safe。
 */
function triggerDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
