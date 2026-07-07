/**
 * MembersScreen.tsx - Phase-21 T52
 * 会员列表页
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

interface Member {
  id: string;
  name: string;
  level: 'bronze' | 'silver' | 'gold';
  points: number;
}

const MOCK_MEMBERS: Member[] = [];

export const MembersScreen: React.FC = () => {
  if (MOCK_MEMBERS.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无会员</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={MOCK_MEMBERS}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.level}>{item.level}</Text>
          <Text style={styles.points}>{item.points} 分</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: { flex: 1, fontSize: 16 },
  level: { fontSize: 14, color: '#666', marginRight: 12 },
  points: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
});