import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card } from './common/Card';

interface MemberCardProps {
  memberId: string;
  nickname: string;
  avatarUrl?: string;
  tier: 'GUEST' | 'MEMBER' | 'SVIP';
  pointsBalance: number;
  onPress?: () => void;
}

const tierLabels: Record<string, string> = {
  GUEST: '游客',
  MEMBER: '会员',
  SVIP: 'SVIP',
};

const tierColors: Record<string, string> = {
  GUEST: '#999999',
  MEMBER: '#007AFF',
  SVIP: '#FF9500',
};

export function MemberCard({
  memberId,
  nickname,
  avatarUrl,
  tier,
  pointsBalance,
  onPress,
}: MemberCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.nickname}>{nickname}</Text>
            <Text style={styles.memberId}>ID: {memberId}</Text>
          </View>
          <View
            style={[
              styles.tierBadge,
              { backgroundColor: tierColors[tier] },
            ]}
          >
            <Text style={styles.tierText}>{tierLabels[tier]}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsLabel}>积分余额</Text>
            <Text style={styles.pointsValue}>{pointsBalance.toLocaleString()}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  memberId: {
    fontSize: 13,
    color: '#666666',
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666666',
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF9500',
  },
});
