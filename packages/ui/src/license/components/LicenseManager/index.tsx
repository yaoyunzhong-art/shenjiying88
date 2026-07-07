/**
 * LicenseManager - License 管理界面组件 (V9 需求 2 · V10 Day 20 Phase 88)
 *
 * 功能:
 * - W-4 管理员视图: 全平台 License 管理
 * - W-T 租户视图: 租户级 License 管理
 * - License 列表展示 (表格/卡片)
 * - License 操作 (激活/暂停/续费/删除)
 * - 激活码生成 (管理员)
 * - 审计日志查看
 * - 5端响应式设计 (PC/H5/APP/Pad/小程序)
 *
 * @note 本组件为 Web 版，使用 React + TypeScript
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useAdaptive } from '../../../ai-model-switcher/responsive/AdaptiveLayout';
import { useLicense } from '../../hooks/useLicense';
import { LicenseStatusBadge } from '../LicenseStatusBadge';
import type {
  License,
  LicenseStatus,
  LicenseScope,
  LicenseLevel,
} from '../../types';

// ============ 类型定义 ============

/** 视图模式 */
type ViewMode = 'table' | 'card' | 'compact';

/** 用户角色 */
type UserRole = 'admin' | 'tenant' | 'store';

/** License 操作类型 */
type LicenseAction = 'activate' | 'suspend' | 'renew' | 'delete' | 'view';

/** 过滤条件 */
interface FilterState {
  status: LicenseStatus | 'all';
  scope: LicenseScope | 'all';
  level: LicenseLevel | 'all';
  source: string;
  search: string;
  dateRange: [Date | null, Date | null];
}

/** 排序配置 */
interface SortConfig {
  key: keyof License;
  direction: 'asc' | 'desc';
}

/** 组件 Props */
export interface LicenseManagerProps {
  /** 当前角色 */
  role: UserRole;
  /** 租户ID (租户视图必需) */
  tenantId?: string;
  /** 门店ID (门店视图必需) */
  storeId?: string;
  /** 默认视图模式 */
  defaultViewMode?: ViewMode;
  /** 是否显示激活码生成 */
  showActivationCode?: boolean;
  /** 是否显示审计日志 */
  showAuditLog?: boolean;
  /** 自定义操作 */
  customActions?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick: (license: License) => void;
  }>;
  /** 样式 */
  style?: React.CSSProperties;
  className?: string;
}

// ============ 辅助函数 ============

/** 格式化日期 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/** 计算剩余天数 */
const getDaysRemaining = (validUntil: string): number => {
  const end = new Date(validUntil).getTime();
  const now = Date.now();
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/** 获取状态颜色 */
const getStatusColor = (status: LicenseStatus): string => {
  const colors: Record<LicenseStatus, string> = {
    active: '#10B981',
    expired: '#EF4444',
    suspended: '#F59E0B',
    trial: '#3B82F6',
  };
  return colors[status];
};

// ============ 组件 ============

export const LicenseManager: React.FC<LicenseManagerProps> = ({
  role,
  tenantId,
  storeId,
  defaultViewMode = 'table',
  showActivationCode = role === 'admin',
  showAuditLog = true,
  customActions = [],
  style,
  className,
}) => {
  // 自适应布局
  const { is } = useAdaptive();
  const isPC = is.pc;
  const isPad = is.pad;
  const isMobile = is.h5 || is.app;
  const isMini = is.miniapp;
  
  // 确定最佳视图模式
  const optimalViewMode = useMemo<ViewMode>(() => {
    if (isMobile || isMini) return 'compact';
    if (isPad) return 'card';
    return defaultViewMode;
  }, [isMobile, isMini, isPad, defaultViewMode]);

  // 状态管理
  const [viewMode, setViewMode] = useState<ViewMode>(optimalViewMode);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    scope: 'all',
    level: 'all',
    source: 'all',
    search: '',
    dateRange: [null, null],
  });
  const [sort, setSort] = useState<SortConfig>({
    key: 'validUntil',
    direction: 'desc',
  });
  const [selectedLicenses, setSelectedLicenses] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // 使用 License Hook 获取数据
  const { license, status, error, refreshLicense } = useLicense({
    scope: filters.scope !== 'all' ? filters.scope : 'ai.capability',
    autoCheck: true,
  });

  // 模拟 License 数据 (实际应从 API 获取)
  const mockLicenses: License[] = useMemo(() => {
    const baseDate = new Date();
    return [
      {
        id: 'lic-001',
        tenantId: tenantId || 'tenant-001',
        storeId: role === 'store' ? storeId : undefined,
        scope: 'ai.capability',
        level: 'tenant',
        status: 'active',
        quota: { used: 1234, total: 100000 },
        validFrom: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        validUntil: new Date(baseDate.getTime() + 335 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { activationSource: 'paid' },
      },
      {
        id: 'lic-002',
        tenantId: tenantId || 'tenant-001',
        scope: 'ai.knowledge',
        level: 'tenant',
        status: 'trial',
        quota: { used: 500, total: 5000 },
        validFrom: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        validUntil: new Date(baseDate.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { activationSource: 'trial' },
      },
      {
        id: 'lic-003',
        tenantId: tenantId || 'tenant-001',
        scope: 'ai.capability',
        level: 'store',
        storeId: 'store-001',
        status: 'expired',
        quota: { used: 8500, total: 10000 },
        validFrom: new Date(baseDate.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        validUntil: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { activationSource: 'paid' },
      },
    ];
  }, [tenantId, storeId, role]);

  // 过滤和排序
  const filteredLicenses = useMemo(() => {
    let result = [...mockLicenses];

    // 状态过滤
    if (filters.status !== 'all') {
      result = result.filter(l => l.status === filters.status);
    }

    // 范围过滤
    if (filters.scope !== 'all') {
      result = result.filter(l => l.scope === filters.scope);
    }

    // 层级过滤
    if (filters.level !== 'all') {
      result = result.filter(l => l.level === filters.level);
    }

    // 来源过滤
    if (filters.source !== 'all') {
      result = result.filter(l =>
        (l.metadata as Record<string, unknown>)?.activationSource === filters.source
      );
    }

    // 搜索过滤
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(l =>
        l.id.toLowerCase().includes(searchLower) ||
        l.tenantId.toLowerCase().includes(searchLower) ||
        (l.storeId && l.storeId.toLowerCase().includes(searchLower))
      );
    }

    // 日期范围过滤
    if (filters.dateRange[0] || filters.dateRange[1]) {
      result = result.filter(l => {
        const validUntil = new Date(l.validUntil).getTime();
        if (filters.dateRange[0] && validUntil < filters.dateRange[0].getTime()) return false;
        if (filters.dateRange[1] && validUntil > filters.dateRange[1].getTime()) return false;
        return true;
      });
    }

    // 排序
    result.sort((a, b) => {
      const aVal = a[sort.key] as string | number;
      const bVal = b[sort.key] as string | number;
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [mockLicenses, filters, sort]);

  // 处理选择
  const handleSelect = useCallback((id: string) => {
    setSelectedLicenses(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedLicenses.size === filteredLicenses.length) {
      setSelectedLicenses(new Set());
    } else {
      setSelectedLicenses(new Set(filteredLicenses.map(l => l.id)));
    }
  }, [filteredLicenses, selectedLicenses.size]);

  // 处理操作
  const handleAction = useCallback(async (action: LicenseAction, license: License) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'activate':
          // 激活 License
          console.log('激活 License:', license.id);
          break;
        case 'suspend':
          // 暂停 License
          console.log('暂停 License:', license.id);
          break;
        case 'renew':
          // 续费 License
          console.log('续费 License:', license.id);
          break;
        case 'delete':
          // 删除 License
          console.log('删除 License:', license.id);
          break;
        case 'view':
          // 查看详情
          console.log('查看 License:', license.id);
          break;
      }
      // 刷新数据
      await refreshLicense();
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshLicense]);

  // 渲染表格视图
  const renderTableView = () => (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: isPC ? '14px' : '12px',
    }}>
      <thead>
        <tr style={{
          backgroundColor: '#F3F4F6',
          borderBottom: '2px solid #E5E7EB',
        }}>
          <th style={{ padding: '12px 8px', textAlign: 'left' }}>
            <input
              type="checkbox"
              checked={selectedLicenses.size === filteredLicenses.length && filteredLicenses.length > 0}
              onChange={handleSelectAll}
            />
          </th>
          <th style={{ padding: '12px 8px', textAlign: 'left' }}>ID</th>
          <th style={{ padding: '12px 8px', textAlign: 'left' }}>范围</th>
          <th style={{ padding: '12px 8px', textAlign: 'left' }}>层级</th>
          <th style={{ padding: '12px 8px', textAlign: 'left' }}>状态</th>
          <th style={{ padding: '12px 8px', textAlign: 'left' }}>来源</th>
          <th style={{ padding: '12px 8px', textAlign: 'left' }}>配额</th>
          <th style={{ padding: '12px 8px', textAlign: 'left' }}>有效期</th>
          <th style={{ padding: '12px 8px', textAlign: 'left' }}>操作</th>
        </tr>
      </thead>
      <tbody>
        {filteredLicenses.map((license) => (
          <tr
            key={license.id}
            style={{
              borderBottom: '1px solid #E5E7EB',
              backgroundColor: selectedLicenses.has(license.id) ? '#EFF6FF' : 'transparent',
            }}
          >
            <td style={{ padding: '12px 8px' }}>
              <input
                type="checkbox"
                checked={selectedLicenses.has(license.id)}
                onChange={() => handleSelect(license.id)}
              />
            </td>
            <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '12px' }}>
              {license.id.slice(0, 12)}...
            </td>
            <td style={{ padding: '12px 8px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#E5E7EB',
                fontSize: '12px',
              }}>
                {license.scope}
              </span>
            </td>
            <td style={{ padding: '12px 8px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: license.level === 'tenant' ? '#DBEAFE' : '#FEF3C7',
                color: license.level === 'tenant' ? '#1E40AF' : '#92400E',
                fontSize: '12px',
              }}>
                {license.level === 'tenant' ? '租户级' : '门店级'}
              </span>
            </td>
            <td style={{ padding: '12px 8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: getStatusColor(license.status) + '20',
                color: getStatusColor(license.status),
                fontSize: '12px',
                fontWeight: 500,
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(license.status),
                }} />
                {license.status === 'active' && '活跃'}
                {license.status === 'expired' && '已过期'}
                {license.status === 'suspended' && '已暂停'}
                {license.status === 'trial' && '试用中'}
              </span>
            </td>
            <td style={{ padding: '12px 8px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#F3F4F6',
                fontSize: '12px',
                color: '#6B7280',
              }}>
                {(license.metadata as Record<string, unknown>)?.activationSource === 'paid' && '付费'}
                {(license.metadata as Record<string, unknown>)?.activationSource === 'trial' && '试用'}
                {(license.metadata as Record<string, unknown>)?.activationSource === 'tier-match' && '等级'}
                {(license.metadata as Record<string, unknown>)?.activationSource === 'whitelist' && '白名单'}
              </span>
            </td>
            <td style={{ padding: '12px 8px' }}>
              {license.quota ? (
                <div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {(license.quota?.used ?? 0).toLocaleString()} / {license.quota!.total.toLocaleString()}
                  </div>
                  <div style={{
                    width: '80px',
                    height: '4px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '2px',
                    marginTop: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${Math.min(100, ((license.quota?.used ?? 0) / (license.quota!.total || 1)) * 100)}%`,
                      height: '100%',
                      backgroundColor: ((license.quota?.used ?? 0) / (license.quota!.total || 1)) > 0.9 ? '#EF4444' : '#10B981',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              ) : (
                <span style={{ color: '#9CA3AF', fontSize: '12px' }}>无配额</span>
              )}
            </td>
            <td style={{ padding: '12px 8px' }}>
              <div style={{ fontSize: '12px' }}>
                <div>{formatDate(license.validFrom)}</div>
                <div style={{ color: '#6B7280' }}>至</div>
                <div style={{
                  color: getDaysRemaining(license.validUntil) <= 7 ? '#EF4444' : '#10B981',
                  fontWeight: 500,
                }}>
                  {formatDate(license.validUntil)}
                </div>
                {getDaysRemaining(license.validUntil) <= 30 && (
                  <div style={{
                    fontSize: '11px',
                    color: getDaysRemaining(license.validUntil) <= 7 ? '#EF4444' : '#F59E0B',
                    marginTop: '2px',
                  }}>
                    剩余 {getDaysRemaining(license.validUntil)} 天
                  </div>
                )}
              </div>
            </td>
            <td style={{ padding: '12px 8px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleAction('view', license)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#6B7280',
                  }}
                  title="查看详情"
                >
                  查看
                </button>
                {license.status === 'active' && (
                  <button
                    onClick={() => handleAction('suspend', license)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #FEF3C7',
                      backgroundColor: '#FFFBEB',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#92400E',
                    }}
                    title="暂停授权"
                  >
                    暂停
                  </button>
                )}
                {license.status === 'suspended' && (
                  <button
                    onClick={() => handleAction('activate', license)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #DBEAFE',
                      backgroundColor: '#EFF6FF',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#1E40AF',
                    }}
                    title="激活授权"
                  >
                    激活
                  </button>
                )}
                {(license.status === 'expired' || getDaysRemaining(license.validUntil) <= 30) && (
                  <button
                    onClick={() => handleAction('renew', license)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #D1FAE5',
                      backgroundColor: '#ECFDF5',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#065F46',
                    }}
                    title="续费授权"
                  >
                    续费
                  </button>
                )}
                {role === 'admin' && (
                  <button
                    onClick={() => handleAction('delete', license)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #FEE2E2',
                      backgroundColor: '#FEF2F2',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#991B1B',
                    }}
                    title="删除授权"
                  >
                    删除
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // 渲染卡片视图
  const renderCardView = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isPC ? 'repeat(3, 1fr)' : isPad ? 'repeat(2, 1fr)' : '1fr',
      gap: '16px',
    }}>
      {filteredLicenses.map((license) => (
        <div
          key={license.id}
          style={{
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: selectedLicenses.has(license.id) ? '#EFF6FF' : '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => handleSelect(license.id)}
        >
          {/* 卡片头部 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#6B7280',
            }}>
              {license.id.slice(0, 16)}...
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: getStatusColor(license.status) + '20',
              color: getStatusColor(license.status),
              fontSize: '12px',
              fontWeight: 500,
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(license.status),
              }} />
              {license.status === 'active' && '活跃'}
              {license.status === 'expired' && '已过期'}
              {license.status === 'suspended' && '已暂停'}
              {license.status === 'trial' && '试用中'}
            </span>
          </div>

          {/* 卡片内容 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{ color: '#6B7280', fontSize: '13px' }}>范围</span>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>{license.scope}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{ color: '#6B7280', fontSize: '13px' }}>层级</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: license.level === 'tenant' ? '#DBEAFE' : '#FEF3C7',
                color: license.level === 'tenant' ? '#1E40AF' : '#92400E',
                fontSize: '12px',
              }}>
                {license.level === 'tenant' ? '租户级' : '门店级'}
              </span>
            </div>
            {license.quota && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <span style={{ color: '#6B7280', fontSize: '13px' }}>配额</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {(license.quota?.used ?? 0).toLocaleString()} / {license.quota!.total.toLocaleString()}
                  </div>
                  <div style={{
                    width: '80px',
                    height: '4px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '2px',
                    marginTop: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${Math.min(100, ((license.quota?.used ?? 0) / (license.quota!.total || 1)) * 100)}%`,
                      height: '100%',
                      backgroundColor: ((license.quota?.used ?? 0) / (license.quota!.total || 1)) > 0.9 ? '#EF4444' : '#10B981',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 有效期 */}
          <div style={{
            padding: '12px',
            backgroundColor: '#F9FAFB',
            borderRadius: '6px',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>有效期至</span>
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                color: getDaysRemaining(license.validUntil) <= 7 ? '#EF4444' : '#10B981',
              }}>
                {formatDate(license.validUntil)}
              </span>
            </div>
            {getDaysRemaining(license.validUntil) <= 30 && (
              <div style={{
                fontSize: '11px',
                color: getDaysRemaining(license.validUntil) <= 7 ? '#EF4444' : '#F59E0B',
                textAlign: 'right',
              }}>
                剩余 {getDaysRemaining(license.validUntil)} 天
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction('view', license);
              }}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#6B7280',
              }}
            >
              查看
            </button>
            {license.status === 'active' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('suspend', license);
                }}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #FEF3C7',
                  backgroundColor: '#FFFBEB',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#92400E',
                }}
              >
                暂停
              </button>
            )}
            {(license.status === 'expired' || getDaysRemaining(license.validUntil) <= 30) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('renew', license);
                }}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #D1FAE5',
                  backgroundColor: '#ECFDF5',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#065F46',
                }}
              >
                续费
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // 渲染紧凑视图 (移动端)
  const renderCompactView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {filteredLicenses.map((license) => (
        <div
          key={license.id}
          onClick={() => handleSelect(license.id)}
          style={{
            padding: '12px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            backgroundColor: selectedLicenses.has(license.id) ? '#EFF6FF' : '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          {/* 头部 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              {license.id.slice(0, 20)}...
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: getStatusColor(license.status) + '20',
              color: getStatusColor(license.status),
              fontSize: '11px',
            }}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(license.status),
              }} />
              {license.status}
            </span>
          </div>

          {/* 信息 */}
          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
            <div>{license.scope} · {license.level}</div>
            <div>有效期至: {formatDate(license.validUntil)}</div>
          </div>

          {/* 操作 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction('view', license);
              }}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                fontSize: '11px',
                color: '#6B7280',
              }}
            >
              查看
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction('renew', license);
              }}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#10B981',
                fontSize: '11px',
                color: '#FFFFFF',
              }}
            >
              续费
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // 主渲染
  return (
    <div style={{
      padding: isPC ? '24px' : '16px',
      backgroundColor: '#F9FAFB',
      minHeight: '100vh',
      ...style,
    }} className={className}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{
            fontSize: isPC ? '24px' : '20px',
            fontWeight: 600,
            color: '#111827',
            margin: 0,
            marginBottom: '4px',
          }}>
            License 管理
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: 0,
          }}>
            {role === 'admin' ? '全平台授权管理' : role === 'tenant' ? '租户级授权管理' : '门店级授权管理'}
            · 共 {filteredLicenses.length} 条记录
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* 视图切换 */}
          <div style={{
            display: 'flex',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            overflow: 'hidden',
          }}>
            {(['table', 'card', 'compact'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: viewMode === mode ? '#3B82F6' : '#FFFFFF',
                  color: viewMode === mode ? '#FFFFFF' : '#6B7280',
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderRight: mode !== 'compact' ? '1px solid #E5E7EB' : 'none',
                }}
              >
                {mode === 'table' && '表格'}
                {mode === 'card' && '卡片'}
                {mode === 'compact' && '紧凑'}
              </button>
            ))}
          </div>
          {/* 刷新按钮 */}
          <button
            onClick={() => refreshLicense()}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isLoading ? '刷新中...' : '刷新'}
          </button>
          {/* 新建按钮 (管理员) */}
          {showActivationCode && (
            <button
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#3B82F6',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              + 新建 License
            </button>
          )}
        </div>
      </div>

      {/* 过滤器 */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isPC ? 'repeat(5, 1fr)' : isPad ? 'repeat(3, 1fr)' : '1fr',
          gap: '12px',
          marginBottom: '12px',
        }}>
          {/* 状态过滤 */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              状态
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as LicenseStatus | 'all' }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
              }}
            >
              <option value="all">全部</option>
              <option value="active">活跃</option>
              <option value="inactive">未激活</option>
              <option value="expired">已过期</option>
              <option value="suspended">已暂停</option>
              <option value="pending">待激活</option>
            </select>
          </div>

          {/* 范围过滤 */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              范围
            </label>
            <select
              value={filters.scope}
              onChange={(e) => setFilters(prev => ({ ...prev, scope: e.target.value as LicenseScope | 'all' }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
              }}
            >
              <option value="all">全部</option>
              <option value="ai.capability">AI能力</option>
              <option value="ai.knowledge">知识库</option>
              <option value="ai.industry">行业增值</option>
              <option value="integration.open">系统集成</option>
            </select>
          </div>

          {/* 层级过滤 */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              层级
            </label>
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value as LicenseLevel | 'all' }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
              }}
            >
              <option value="all">全部</option>
              <option value="tenant">租户级</option>
              <option value="store">门店级</option>
            </select>
          </div>

          {/* 来源过滤 */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              来源
            </label>
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
              }}
            >
              <option value="all">全部</option>
              <option value="paid">付费</option>
              <option value="trial">试用</option>
              <option value="tier-match">等级</option>
              <option value="whitelist">白名单</option>
            </select>
          </div>

          {/* 搜索 */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              搜索
            </label>
            <input
              type="text"
              placeholder="搜索 ID/租户/门店..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* 过滤操作 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: '#6B7280' }}>
            共 {filteredLicenses.length} 条记录
            {selectedLicenses.size > 0 && `，已选择 ${selectedLicenses.size} 条`}
          </div>
          <button
            onClick={() => {
              setFilters({
                status: 'all',
                scope: 'all',
                level: 'all',
                source: 'all',
                search: '',
                dateRange: [null, null],
              });
              setSelectedLicenses(new Set());
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#6B7280',
            }}
          >
            重置过滤
          </button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedLicenses.size > 0 && (
        <div style={{
          backgroundColor: '#EFF6FF',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '14px', color: '#1E40AF' }}>
            已选择 <strong>{selectedLicenses.size}</strong> 条记录
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                // 批量暂停
                console.log('批量暂停:', Array.from(selectedLicenses));
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #F59E0B',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#D97706',
              }}
            >
              批量暂停
            </button>
            <button
              onClick={() => {
                // 批量续费
                console.log('批量续费:', Array.from(selectedLicenses));
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#10B981',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#FFFFFF',
              }}
            >
              批量续费
            </button>
            <button
              onClick={() => setSelectedLicenses(new Set())}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#6B7280',
              }}
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* 数据展示 */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        {filteredLicenses.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: '#6B7280',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
              没有找到匹配的 License
            </div>
            <div style={{ fontSize: '14px' }}>
              请尝试调整过滤条件或重置搜索
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'table' && renderTableView()}
            {viewMode === 'card' && renderCardView()}
            {viewMode === 'compact' && renderCompactView()}
          </>
        )}
      </div>

      {/* 分页 (简化版) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: '14px', color: '#6B7280' }}>
          显示 1 - {filteredLicenses.length} 条，共 {filteredLicenses.length} 条
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            disabled
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              cursor: 'not-allowed',
              fontSize: '13px',
              color: '#9CA3AF',
            }}
          >
            上一页
          </button>
          <button
            disabled
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              cursor: 'not-allowed',
              fontSize: '13px',
              color: '#9CA3AF',
            }}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenseManager;
