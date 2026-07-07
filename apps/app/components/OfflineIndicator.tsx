/**
 * 离线状态指示器
 * Offline Indicator - 显示网络状态和同步状态
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOffline } from '../context/OfflineContext';

interface OfflineIndicatorProps {
  compact?: boolean;
}

export function OfflineIndicator({ compact = false }: OfflineIndicatorProps) {
  const { state, syncNow } = useOffline();

  if (!state.isOffline && state.pendingCount === 0 && !state.isSyncing) {
    return null;
  }

  if (compact) {
    return (
      <View style={[styles.compactContainer, state.isOffline && styles.offlineBg]}>
        <Text style={styles.compactIcon}>
          {state.isOffline ? '📵' : state.isSyncing ? '🔄' : '📤'}
        </Text>
        {state.pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{state.pendingCount}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, state.isOffline && styles.containerOffline]}>
      <View style={styles.content}>
        <Text style={styles.icon}>
          {state.isOffline ? '📵' : state.isSyncing ? '🔄' : '📤'}
        </Text>
        <View style={styles.textContainer}>
          <Text style={styles.status}>
            {state.isOffline
              ? '当前离线'
              : state.isSyncing
              ? '同步中...'
              : `待同步 ${state.pendingCount} 项`}
          </Text>
          {state.lastSyncTime > 0 && !state.isOffline && !state.isSyncing && (
            <Text style={styles.lastSync}>
              上次同步: {new Date(state.lastSyncTime).toLocaleTimeString()}
            </Text>
          )}
        </View>
      </View>
      
      {!state.isOffline && state.pendingCount > 0 && !state.isSyncing && (
        <TouchableOpacity style={styles.syncButton} onPress={syncNow}>
          <Text style={styles.syncButtonText}>立即同步</Text>
        </TouchableOpacity>
      )}
      
      {state.error && (
        <Text style={styles.errorText}>{state.error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  containerOffline: {
    backgroundColor: '#FEE2E2',
    borderBottomColor: '#FECACA',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  lastSync: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineBg: {
    backgroundColor: '#FEE2E2',
  },
  compactIcon: {
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
