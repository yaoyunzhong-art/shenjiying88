'use client';

/**
 * 日志审计 — Audit Logs
 *
 * 功能:
 *  - 审计日志列表（时间/操作人/操作类型/目标/IP/结果）
 *  - 操作类型: 登录/登出/数据修改/权限变更/系统设置/导出
 *  - 结果: 成功/失败/拒绝
 *  - Tab筛选: 全部/失败（只显示失败操作）
 *  - 搜索: 按操作人搜索（输入框+回车触发）
 *  - 概览统计: 总日志数/今日/今日失败
 *  - 数据: default 样本（10条记录，含2条失败）
 *  - 空态增强(SVG+引导)
 *  - 刷新按钮
 */

import { useState, useMemo } from 'react';
import { AdminPermissionGate } from '../components/admin-permission-gate';

// ==================== 类型定义 ====================

type AuditResult = 'success' | 'failure' | 'denied';

type AuditActionType =
  | 'login'
  | 'logout'
  | 'data_modify'
  | 'permission_change'
  | 'system_setting'
  | 'export';

interface AuditLogEntry {
  id: string;
  time: string;
  operator: string;
  actionType: AuditActionType;
  target: string;
  ip: string;
  result: AuditResult;
  detail: string;
}

// ==================== 常量映射 ====================

const ACTION_TYPE_LABEL: Record<AuditActionType, string> = {
  login: '登录',
  logout: '登出',
  data_modify: '数据修改',
  permission_change: '权限变更',
  system_setting: '系统设置',
  export: '导出',
};

const RESULT_LABEL: Record<AuditResult, string> = {
  success: '成功',
  failure: '失败',
  denied: '拒绝',
};

const RESULT_COLOR: Record<AuditResult, string> = {
  success: '#22c55e',
  failure: '#ef4444',
  denied: '#eab308',
};

const RESULT_BG: Record<AuditResult, string> = {
  success: 'rgba(34,197,94,0.1)',
  failure: 'rgba(239,68,68,0.1)',
  denied: 'rgba(234,179,8,0.1)',
};

// ==================== 默认样本数据 ====================

const DEFAULT_LOGS: AuditLogEntry[] = [
  { id: 'log-001', time: '2026-07-18 14:32:10', operator: 'admin@demo.com', actionType: 'login', target: '管理后台', ip: '192.168.1.100', result: 'success', detail: '管理员登录管理后台' },
  { id: 'log-002', time: '2026-07-18 13:15:00', operator: 'zhang@demo.com', actionType: 'data_modify', target: '商品信息(ID: PD-1024)', ip: '10.0.0.55', result: 'success', detail: '修改商品售价 128 → 99' },
  { id: 'log-003', time: '2026-07-18 11:20:30', operator: 'li@demo.com', actionType: 'permission_change', target: '用户角色(ID: role-admin)', ip: '192.168.1.88', result: 'failure', detail: '尝试提升用户权限但权限不足' },
  { id: 'log-004', time: '2026-07-18 10:05:45', operator: 'wang@demo.com', actionType: 'system_setting', target: '系统参数-限流配置', ip: '10.0.1.22', result: 'success', detail: '更新API限流阈值 100→200 QPS' },
  { id: 'log-005', time: '2026-07-18 09:30:00', operator: 'system', actionType: 'login', target: '系统自动任务', ip: '127.0.0.1', result: 'failure', detail: '自动登录超时，令牌已过期' },
  { id: 'log-006', time: '2026-07-17 18:00:00', operator: 'admin@demo.com', actionType: 'logout', target: '管理后台', ip: '192.168.1.100', result: 'success', detail: '管理员安全登出' },
  { id: 'log-007', time: '2026-07-17 16:45:20', operator: 'zhang@demo.com', actionType: 'export', target: '销售报表-2026Q2', ip: '10.0.0.55', result: 'success', detail: '导出Q2销售报表(CSV格式)' },
  { id: 'log-008', time: '2026-07-17 15:10:00', operator: 'li@demo.com', actionType: 'data_modify', target: '订单状态(ID: ORD-8921)', ip: '192.168.1.88', result: 'denied', detail: '尝试修改已发货订单状态被拒绝' },
  { id: 'log-009', time: '2026-07-17 14:00:00', operator: 'admin@demo.com', actionType: 'system_setting', target: '通知模板-短信', ip: '192.168.1.100', result: 'success', detail: '更新短信通知模板内容' },
  { id: 'log-010', time: '2026-07-17 11:30:00', operator: 'wang@demo.com', actionType: 'export', target: '会员清单', ip: '10.0.1.22', result: 'success', detail: '导出活跃会员清单' },
];

// ==================== 辅助函数 ====================

function isToday(timeStr: string): boolean {
  return timeStr.startsWith('2026-07-18');
}

function computeStats(logs: AuditLogEntry[]) {
  const total = logs.length;
  const today = logs.filter((l) => isToday(l.time)).length;
  const todayFailures = logs.filter((l) => isToday(l.time) && l.result === 'failure').length;
  return { total, today, todayFailures };
}

function filterLogs(
  logs: AuditLogEntry[],
  tab: 'all' | 'failure',
  searchQuery: string,
): AuditLogEntry[] {
  let result = logs;
  if (tab === 'failure') {
    result = result.filter((l) => l.result === 'failure');
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((l) => l.operator.toLowerCase().includes(q));
  }
  return result;
}

// ==================== 子组件 ====================

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        color: '#94a3b8',
      }}
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: 20 }}
      >
        <rect x="20" y="30" width="80" height="65" rx="6" stroke="#475569" strokeWidth="2" fill="rgba(71,85,105,0.1)" />
        <line x1="35" y1="48" x2="85" y2="48" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        <line x1="35" y1="58" x2="70" y2="58" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        <line x1="35" y1="68" x2="78" y2="68" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        <line x1="35" y1="78" x2="60" y2="78" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        <circle cx="95" cy="25" r="10" fill="rgba(71,85,105,0.15)" stroke="#475569" strokeWidth="2" />
        <text x="95" y="29" textAnchor="middle" fontSize="12" fill="#64748b">📝</text>
      </svg>
      <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: '#64748b' }}>
        暂无审计日志
      </p>
      <p style={{ fontSize: 13, marginBottom: 20, textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
        审计日志将记录所有管理员的操作行为。<br />
        当有操作发生时，日志将自动生成并显示在此处。
      </p>
      <button
        onClick={onRefresh}
        style={{
          padding: '8px 20px',
          background: 'rgba(59,130,246,0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(59,130,246,0.25)'; }}
        onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(59,130,246,0.15)'; }}
      >
        ↻ 刷新
      </button>
    </div>
  );
}

function EmptySearchState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        color: '#94a3b8',
      }}
    >
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: 20 }}
      >
        <circle cx="42" cy="42" r="25" stroke="#475569" strokeWidth="2" fill="rgba(71,85,105,0.1)" />
        <line x1="60" y1="60" x2="82" y2="82" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        <text x="42" y="47" textAnchor="middle" fontSize="16" fill="#64748b">🔍</text>
      </svg>
      <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: '#64748b' }}>
        未找到匹配日志
      </p>
      <p style={{ fontSize: 13, marginBottom: 20, textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
        搜索 "{query}" 未找到相关记录。<br />
        请尝试其他关键词或
        <button
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            color: '#60a5fa',
            cursor: 'pointer',
            fontSize: 13,
            textDecoration: 'underline',
            padding: 0,
            marginLeft: 4,
          }}
        >
          清除搜索
        </button>
      </p>
    </div>
  );
}

// ==================== 样式常量 ====================

const CARD: React.CSSProperties = {
  borderRadius: 12,
  background: 'rgba(15,23,42,0.4)',
  border: '1px solid rgba(148,163,184,0.1)',
  padding: 16,
  marginBottom: 16,
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(15,23,42,0.5)',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 6,
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

// ==================== 主页面 ====================

export default function AuditLogsPage() {
  const [logs] = useState<AuditLogEntry[]>(DEFAULT_LOGS);
  const [tab, setTab] = useState<'all' | 'failure'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const permissionGate = {
    requiredPermission: 'foundation.governance.read',
    title: '日志审计访问受限',
    description:
      '日志审计页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看操作日志、失败筛选与审计明细。',
  } as const;

  const stats = useMemo(() => computeStats(logs), [logs]);

  const filtered = useMemo(
    () => filterLogs(logs, tab, searchQuery),
    [logs, tab, searchQuery],
  );

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleRefresh = () => {
    // Refresh simulation: trigger re-render by toggling a state
    // In a real app, this would re-fetch from the API
  };

  return (
    <AdminPermissionGate {...permissionGate}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32, minHeight: '100vh' }}>
        {/* 页面标题 */}
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>📋 审计日志</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>查看所有管理员操作审计记录，支持筛选、搜索和实时刷新</p>
        </header>

      {/* 概览统计 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ ...CARD, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>总日志数</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#60a5fa' }}>
            {stats.total}
          </div>
        </div>
        <div style={{ ...CARD, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>今日</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#34d399' }}>
            {stats.today}
          </div>
        </div>
        <div style={{ ...CARD, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>今日失败</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#f87171' }}>
            {stats.todayFailures}
          </div>
        </div>
      </div>

      {/* 操作栏: Tab + 搜索 + 刷新 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Tab 筛选 */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => { setTab('all'); setSearchQuery(''); setSearchInput(''); }}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
              border: tab === 'all' ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(148,163,184,0.2)',
              background: tab === 'all' ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: tab === 'all' ? '#60a5fa' : '#94a3b8',
              fontWeight: tab === 'all' ? 500 : 400,
              transition: 'all 0.15s',
            }}
          >
            全部 ({logs.length})
          </button>
          <button
            onClick={() => { setTab('failure'); setSearchQuery(''); setSearchInput(''); }}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
              border: tab === 'failure' ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(148,163,184,0.2)',
              background: tab === 'failure' ? 'rgba(239,68,68,0.15)' : 'transparent',
              color: tab === 'failure' ? '#f87171' : '#94a3b8',
              fontWeight: tab === 'failure' ? 500 : 400,
              transition: 'all 0.15s',
            }}
          >
            失败 ({logs.filter((l) => l.result === 'failure').length})
          </button>
        </div>

        {/* 搜索框 */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="按操作人搜索..."
            style={INPUT_STYLE}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearchQuery(''); }}
              style={{
                position: 'absolute',
                right: 32,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: 14,
                padding: '2px 4px',
              }}
            >
              ✕
            </button>
          )}
          <button
            onClick={handleSearch}
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(59,130,246,0.2)',
              border: 'none',
              borderRadius: 4,
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: 12,
              padding: '4px 8px',
            }}
          >
            搜索
          </button>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={handleRefresh}
          style={{
            padding: '8px 14px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 6,
            color: '#60a5fa',
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          title="刷新日志"
        >
          ↻ 刷新
        </button>
      </div>

      {/* 日志列表 */}
      {filtered.length === 0 && searchQuery.trim() ? (
        <div style={CARD}>
          <EmptySearchState query={searchQuery} onClear={handleClearSearch} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={CARD}>
          <EmptyState onRefresh={handleRefresh} />
        </div>
      ) : (
        <div style={CARD}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
                  <th style={thStyle}>时间</th>
                  <th style={thStyle}>操作人</th>
                  <th style={thStyle}>操作类型</th>
                  <th style={thStyle}>目标</th>
                  <th style={thStyle}>IP</th>
                  <th style={thStyle}>结果</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(148,163,184,0.08)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(148,163,184,0.04)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={tdStyle}>
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>
                        {log.time}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12 }}>
                        {log.operator}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          background: 'rgba(148,163,184,0.1)',
                          color: '#94a3b8',
                        }}
                      >
                        {ACTION_TYPE_LABEL[log.actionType]}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#cbd5e1', fontSize: 12 }}>{log.target}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>
                        {log.ip}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          background: RESULT_BG[log.result],
                          color: RESULT_COLOR[log.result],
                        }}
                      >
                        {RESULT_LABEL[log.result]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 0', textAlign: 'right', fontSize: 12, color: '#64748b' }}>
              共 {filtered.length} 条记录
            </div>
          </div>
        </div>
      )}
      </main>
    </AdminPermissionGate>
  );
}

// ==================== 样式 ====================

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  color: '#64748b',
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
};

// ==================== 导出（供测试使用） ====================

export type {
  AuditLogEntry,
  AuditActionType,
  AuditResult,
};

export {
  ACTION_TYPE_LABEL,
  RESULT_LABEL,
  RESULT_COLOR,
  RESULT_BG,
  DEFAULT_LOGS,
  computeStats,
  filterLogs,
  isToday,
};
