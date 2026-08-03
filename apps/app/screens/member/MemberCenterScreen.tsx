import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MemberCard } from '../../components/MemberCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useSession } from '../../context/AppContext';

type MemberStackParamList = {
  MemberCenter: undefined;
  MemberLogin: undefined;
  MemberProfile: undefined;
};

type MemberCenterNavigationProp = NativeStackNavigationProp<MemberStackParamList, 'MemberCenter'>;

interface PrivilegeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const privileges: PrivilegeItem[] = [
  { id: '1', title: '专属折扣', description: '全店商品9折优惠', icon: '🎫' },
  { id: '2', title: '积分翻倍', description: '消费可获双倍积分', icon: '⭐' },
  { id: '3', title: '优先售后', description: '享受优先客服服务', icon: '💬' },
  { id: '4', title: '生日礼包', description: '生日当月赠送礼品', icon: '🎂' },
];

export function MemberCenterScreen() {
  const navigation = useNavigation<MemberCenterNavigationProp>();
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    navigation.navigate('MemberLogin');
  };

  const handleProfile = () => {
    navigation.navigate('MemberProfile');
  };

  if (loading) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestIcon}>⏳</Text>
        <Text style={styles.guestTitle}>加载中...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestIcon}>⚠️</Text>
        <Text style={styles.guestTitle}>数据获取失败</Text>
        <Text style={styles.guestSubtitle}>{error}</Text>
      </View>
    );
  }

  if (!session.authenticated) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestIcon}>👤</Text>
        <Text style={styles.guestTitle}>未登录</Text>
        <Text style={styles.guestSubtitle}>登录后享受更多会员权益</Text>
        <Button
          title="立即登录"
          onPress={handleLogin}
          style={styles.loginButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <MemberCard
          memberId={session.memberId ?? 'N/A'}
          nickname={session.nickname ?? '会员'}
          tier={session.memberTier}
          pointsBalance={12580}
          onPress={handleProfile}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>会员权益</Text>
        <View style={styles.privilegesGrid}>
          {privileges.map((privilege) => (
            <Card key={privilege.id} style={styles.privilegeCard}>
              <Text style={styles.privilegeIcon}>{privilege.icon}</Text>
              <Text style={styles.privilegeTitle}>{privilege.title}</Text>
              <Text style={styles.privilegeDesc}>{privilege.description}</Text>
            </Card>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>积分余额</Text>
        <Card style={styles.pointsCard}>
          <View style={styles.pointsRow}>
            <View style={styles.pointsItem}>
              <Text style={styles.pointsValue}>12,580</Text>
              <Text style={styles.pointsLabel}>可用积分</Text>
            </View>
            <View style={styles.pointsDivider} />
            <View style={styles.pointsItem}>
              <Text style={styles.pointsValue}>¥256.80</Text>
              <Text style={styles.pointsLabel}>积分价值</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>消费记录</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>我的订单</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💳</Text>
            <Text style={styles.menuText}>积分明细</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🎫</Text>
            <Text style={styles.menuText}>优惠券</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    marginTop: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  privilegesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  privilegeCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },
  privilegeIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  privilegeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  privilegeDesc: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  pointsCard: {
    paddingVertical: 20,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsItem: {
    flex: 1,
    alignItems: 'center',
  },
  pointsDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF9500',
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 13,
    color: '#666666',
  },
  menuCard: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 48,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 32,
  },
  guestIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    minWidth: 160,
  },
  bottomPadding: {
    height: 100,
  },
});
