/**
 * MemberDetailScreen.tsx - 会员详情页
 * 含会员信息展示、会员等级、操作按钮(编辑/升级/冻结/解冻)
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

type MemberLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
type MemberStatus = 'active' | 'frozen' | 'inactive';

interface MemberDetail {
  id: string;
  name: string;
  phone: string;
  level: MemberLevel;
  status: MemberStatus;
  points: number;
  totalSpent: number;
  joinDate: string;
  recentVisit: string;
}

interface MemberDetailScreenProps {
  member?: MemberDetail;
  userRole?: 'clerk' | 'manager' | 'admin';
  onEdit?: (member: MemberDetail) => void;
  onChangeLevel?: (member: MemberDetail, newLevel: MemberLevel) => void;
  onFreeze?: (member: MemberDetail) => void;
  onUnfreeze?: (member: MemberDetail) => void;
  onDelete?: (member: MemberDetail) => void;
}

const LEVEL_LABELS: Record<MemberLevel, string> = {
  bronze: '青铜',
  silver: '白银',
  gold: '黄金',
  platinum: '铂金',
};

const LEVEL_COLORS: Record<MemberLevel, string> = {
  bronze: '#CD7F32',
  silver: '#A8A8A8',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const STATUS_LABELS: Record<MemberStatus, string> = {
  active: '正常',
  frozen: '已冻结',
  inactive: '已注销',
};

const STATUS_COLORS: Record<MemberStatus, string> = {
  active: '#22c55e',
  frozen: '#ef4444',
  inactive: '#9ca3af',
};

// TODO: T55 替换为真实 useQuery 数据
const DEFAULT_MEMBER: MemberDetail = {
  id: 'mem-001',
  name: '张三',
  phone: '138****1234',
  level: 'gold',
  status: 'active',
  points: 3280,
  totalSpent: 15680,
  joinDate: '2025-01-15',
  recentVisit: '2026-06-28',
};

export const MemberDetailScreen: React.FC<MemberDetailScreenProps> = ({
  member = DEFAULT_MEMBER,
  userRole = 'clerk',
  onEdit,
  onChangeLevel,
  onFreeze,
  onUnfreeze,
  onDelete,
}) => {
  const canEdit = userRole === 'manager' || userRole === 'admin';
  const canManage = userRole === 'admin';

  return (
    <ScrollView style={styles.container}>
      {/* 会员信息卡片 */}
      <View style={styles.card}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {member.name.charAt(0)}
          </Text>
        </View>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.phone}>{member.phone}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: LEVEL_COLORS[member.level] }]}>
            <Text style={styles.badgeText}>{LEVEL_LABELS[member.level]}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[member.status] }]}>
            <Text style={styles.badgeText}>{STATUS_LABELS[member.status]}</Text>
          </View>
        </View>
      </View>

      {/* 数据概览 */}
      <View style={styles.statsRow}>
        <StatItem label="积分" value={member.points.toLocaleString()} unit="分" />
        <StatItem label="累计消费" value={`¥${member.totalSpent.toLocaleString()}`} unit="" />
        <StatItem label="入会日期" value={member.joinDate} unit="" />
        <StatItem label="最近到店" value={member.recentVisit} unit="" />
      </View>

      {/* 等级变更操作 */}
      {canEdit && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>等级变更</Text>
          <View style={styles.actionRow}>
            {(['bronze', 'silver', 'gold', 'platinum'] as MemberLevel[]).map(
              (lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.actionBtnSmall,
                    member.level === lvl && styles.actionBtnActive,
                    { borderColor: LEVEL_COLORS[lvl] },
                  ]}
                  onPress={() => onChangeLevel?.(member, lvl)}
                  disabled={member.level === lvl}
                  accessibilityLabel={`升级到${LEVEL_LABELS[lvl]}`}
                >
                  <Text
                    style={[
                      styles.actionBtnSmallText,
                      member.level === lvl && styles.actionBtnSmallTextActive,
                    ]}
                  >
                    {LEVEL_LABELS[lvl]}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>
      )}

      {/* 状态操作按钮 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>会员操作</Text>
        <View style={styles.buttonGroup}>
          {canEdit && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => onEdit?.(member)}
              accessibilityLabel="编辑会员信息"
            >
              <Text style={styles.primaryBtnText}>编辑信息</Text>
            </TouchableOpacity>
          )}
          {canManage && member.status === 'active' && (
            <TouchableOpacity
              style={styles.warningBtn}
              onPress={() => onFreeze?.(member)}
              accessibilityLabel="冻结会员"
            >
              <Text style={styles.warningBtnText}>冻结会员</Text>
            </TouchableOpacity>
          )}
          {canManage && member.status === 'frozen' && (
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => onUnfreeze?.(member)}
              accessibilityLabel="解冻会员"
            >
              <Text style={styles.successBtnText}>解冻会员</Text>
            </TouchableOpacity>
          )}
          {canManage && (
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={() => onDelete?.(member)}
              accessibilityLabel="注销会员"
            >
              <Text style={styles.dangerBtnText}>注销会员</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

/** 内联统计项 */
const StatItem: React.FC<{
  label: string;
  value: string;
  unit: string;
}> = ({ label, value, unit }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>
      {value}
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  phone: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 12,
  },
  statItem: { width: '50%', alignItems: 'center', paddingVertical: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  statUnit: { fontSize: 13, color: '#6b7280' },
  statLabel: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  section: { backgroundColor: '#fff', padding: 16, marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtnSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  actionBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  actionBtnSmallText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  actionBtnSmallTextActive: { color: '#fff' },
  buttonGroup: { gap: 10 },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  warningBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  warningBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  successBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dangerBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export type { MemberDetail, MemberLevel, MemberStatus, MemberDetailScreenProps };
