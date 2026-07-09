/**
 * 工具注册管理页 — Tool Registry Management Screen (P-26)
 *
 * 管理 AI 工具的注册、启用/停用、配置与运行状态监控。
 * 作为应用层面的基础设施配置入口，支持门店级工具注册管理。
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import type { RegisteredTool, ToolFilter, ToolCategory, ToolStatus } from '../../services/tool-registry-core';
import {
  getCategoryLabel,
  getCategoryIcon,
  getStatusLabel,
  getStatusColor,
  applyToolFilters,
  countByStatus,
  countByCategory,
  MOCK_TOOLS,
} from '../../services/tool-registry-core';

// ─── 类型和函数导出 (已被 screen 使用者引用) ─────────────────

export type { ToolCategory, ToolStatus, RegisteredTool, ToolConfig, ToolFilter } from '../../services/tool-registry-core';

export {
  getCategoryLabel,
  getCategoryIcon,
  getStatusLabel,
  getStatusColor,
  filterToolsBySearch,
  filterToolsByCategory,
  applyToolFilters,
  countByStatus,
  countByCategory,
  createDefaultToolConfig,
  validateToolConfig,
  MOCK_TOOLS,
} from '../../services/tool-registry-core';

// ─── 屏幕组件 ─────────────────────────────────────────────────

interface ToolRegistryScreenProps {
  /** 外部注入的工具列表，用于测试和 DI */
  tools?: RegisteredTool[];
  /** 初始分类过滤 */
  initialFilter?: ToolFilter;
}

export function ToolRegistryScreen({
  tools: externalTools,
  initialFilter = 'all',
}: ToolRegistryScreenProps) {
  const [tools] = useState<RegisteredTool[]>(externalTools ?? MOCK_TOOLS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ToolFilter>(initialFilter);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);

  const filteredTools = applyToolFilters(tools, searchQuery, categoryFilter);
  const statusCounts = countByStatus(tools);
  const categoryCounts = countByCategory(tools);

  const categoryOptions: { key: ToolFilter; label: string; icon: string }[] = [
    { key: 'all', label: '全部', icon: '📋' },
    { key: 'ai-agent', label: 'AI 代理', icon: '🤖' },
    { key: 'data-pipeline', label: '数据管道', icon: '🔄' },
    { key: 'integration', label: '系统集成', icon: '🔗' },
    { key: 'automation', label: '自动化', icon: '⚡' },
    { key: 'analytics', label: '数据分析', icon: '📊' },
  ];

  const handleToggleTool = useCallback((toolId: string, newStatus: ToolStatus) => {
    Alert.alert(
      newStatus === 'active' ? '启用工具' : '停用工具',
      newStatus === 'active' ? '确定启用该工具？' : '确定停用该工具？',
      [{ text: '取消', style: 'cancel' }, { text: '确定' }]
    );
  }, []);

  const handleRetryTool = useCallback((toolId: string) => {
    Alert.alert('重试', '正在重新连接异常工具...');
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleExpandTool = useCallback((toolId: string) => {
    setExpandedToolId((prev) => (prev === toolId ? null : toolId));
  }, []);

  const errorTools = tools.filter((t) => t.status === 'error');

  const statusKeys: ToolStatus[] = ['active', 'inactive', 'error', 'pending'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>工具注册管理</Text>
        <Text style={styles.headerSubtitle}>基础设施配置</Text>
      </View>

      {/* 状态概览卡片 */}
      <View style={styles.statusSummary}>
        {statusKeys.map((status) => (
          <View key={status} style={styles.statusCard}>
            <Text style={[styles.statusCount, { color: getStatusColor(status) }]}>
              {statusCounts[status]}
            </Text>
            <Text style={styles.statusLabel}>{getStatusLabel(status)}</Text>
          </View>
        ))}
      </View>

      {/* 异常告警横幅 */}
      {errorTools.length > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertEmoji}>🚨</Text>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              {errorTools.length} 个工具运行异常
            </Text>
            <Text style={styles.alertDesc}>
              {errorTools.map((t) => t.errorMessage ?? t.name).join('、')}
            </Text>
          </View>
        </View>
      )}

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索工具名称、描述或分类..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearch}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 分类过滤 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={styles.categoryContent}
      >
        {categoryOptions.map((opt) => {
          const isActive = categoryFilter === opt.key;
          const count =
            opt.key === 'all'
              ? tools.length
              : (categoryCounts[opt.key as ToolCategory] ?? 0);
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => setCategoryFilter(opt.key)}
            >
              <Text style={styles.categoryChipIcon}>{opt.icon}</Text>
              <Text
                style={[
                  styles.categoryChipLabel,
                  isActive && styles.categoryChipLabelActive,
                ]}
              >
                {opt.label}
              </Text>
              <View
                style={[
                  styles.categoryChipCount,
                  isActive && styles.categoryChipCountActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipCountText,
                    isActive && styles.categoryChipCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 工具列表 */}
      <View style={styles.toolListHeader}>
        <Text style={styles.toolListTitle}>
          {categoryFilter === 'all' ? '全部工具' : getCategoryLabel(categoryFilter as ToolCategory)}{' '}
          ({filteredTools.length})
        </Text>
      </View>

      {filteredTools.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔧</Text>
          <Text style={styles.emptyTitle}>未找到匹配的工具</Text>
          <Text style={styles.emptyDesc}>尝试调整搜索条件或分类</Text>
        </View>
      ) : (
        filteredTools.map((tool) => {
          const isExpanded = expandedToolId === tool.id;
          const statusColor = getStatusColor(tool.status);
          return (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => handleExpandTool(tool.id)}
              activeOpacity={0.7}
            >
              {/* 工具头部 */}
              <View style={styles.toolHeader}>
                <View
                  style={[
                    styles.toolIconContainer,
                    { backgroundColor: statusColor + '15' },
                  ]}
                >
                  <Text style={styles.toolIcon}>
                    {getCategoryIcon(tool.category)}
                  </Text>
                </View>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolName}>{tool.name}</Text>
                  <Text style={styles.toolCategory}>
                    {getCategoryLabel(tool.category)} v{tool.version}
                  </Text>
                </View>
                <View style={styles.toolStatusArea}>
                  <View
                    style={[
                      styles.toolStatusBadge,
                      { backgroundColor: statusColor + '20' },
                    ]}
                  >
                    <Text style={[styles.toolStatusText, { color: statusColor }]}>
                      {getStatusLabel(tool.status)}
                    </Text>
                  </View>
                  <Text style={styles.expandArrow}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
              </View>

              {/* 展开详情 */}
              {isExpanded && (
                <View style={styles.toolDetail}>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                  <View style={styles.toolMetaRow}>
                    <Text style={styles.toolMetaLabel}>心跳</Text>
                    <Text style={styles.toolMetaValue}>{tool.lastHeartbeat}</Text>
                  </View>
                  {tool.endpointUrl && (
                    <View style={styles.toolMetaRow}>
                      <Text style={styles.toolMetaLabel}>端点</Text>
                      <Text style={styles.toolMetaValue} numberOfLines={1}>
                        {tool.endpointUrl}
                      </Text>
                    </View>
                  )}
                  {tool.errorMessage && (
                    <View style={styles.errorBlock}>
                      <Text style={styles.errorText}>⚠ {tool.errorMessage}</Text>
                    </View>
                  )}

                  {/* 操作按钮 */}
                  <View style={styles.toolActions}>
                    {tool.status === 'active' ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionDanger]}
                        onPress={() => handleToggleTool(tool.id, 'inactive')}
                      >
                        <Text style={styles.actionBtnTextDanger}>停用</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionSuccess]}
                        onPress={() => handleToggleTool(tool.id, 'active')}
                      >
                        <Text style={styles.actionBtnTextSuccess}>启用</Text>
                      </TouchableOpacity>
                    )}
                    {tool.status === 'error' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionWarning]}
                        onPress={() => handleRetryTool(tool.id)}
                      >
                        <Text style={styles.actionBtnTextWarning}>重试</Text>
                      </TouchableOpacity>
                    )}
                    {tool.configurable && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionPrimary]}
                        onPress={() => {
                          Alert.alert('配置', `打开 ${tool.name} 配置面板`);
                        }}
                      >
                        <Text style={styles.actionBtnTextPrimary}>配置</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ─── 样式 ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E40AF',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93C5FD',
    marginTop: 4,
  },
  statusSummary: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 8,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statusCount: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  alertEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
  },
  alertDesc: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#1E293B',
  },
  clearSearch: {
    padding: 6,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  categoryRow: {
    marginBottom: 8,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  categoryChipIcon: {
    fontSize: 14,
  },
  categoryChipLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  categoryChipLabelActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  categoryChipCount: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  categoryChipCountActive: {
    backgroundColor: '#C7D2FE',
  },
  categoryChipCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  categoryChipCountTextActive: {
    color: '#4F46E5',
  },
  toolListHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  toolListTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  toolCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolIcon: {
    fontSize: 22,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  toolCategory: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  toolStatusArea: {
    alignItems: 'flex-end',
    gap: 4,
  },
  toolStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  toolStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandArrow: {
    fontSize: 10,
    color: '#94A3B8',
  },
  toolDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  toolDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 10,
  },
  toolMetaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  toolMetaLabel: {
    fontSize: 12,
    color: '#94A3B8',
    width: 44,
  },
  toolMetaValue: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  errorBlock: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
  },
  toolActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  actionBtnTextSuccess: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  actionDanger: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  actionBtnTextDanger: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  actionWarning: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  actionBtnTextWarning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
  actionPrimary: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  actionBtnTextPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  bottomPadding: {
    height: 100,
  },
});
