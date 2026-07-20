import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

const mockStores = [
  { id: '1', name: '神机营体育·城西店', address: '杭州市西湖区文二路388号', distance: '1.2km', services: ['羽毛球', '游泳', '健身'], rating: 4.8 },
  { id: '2', name: '神机营体育·旗舰店', address: '杭州市拱墅区延安路888号', distance: '3.5km', services: ['全项目', '私教'], rating: 4.9 },
  { id: '3', name: '神机营体育·城东店', address: '杭州市江干区钱江路566号', distance: '5.1km', services: ['羽毛球', '乒乓球'], rating: 4.6 },
];

export function StoreSearchScreen() {
  const [keyword, setKeyword] = useState('');

  const filteredStores = keyword.trim()
    ? mockStores.filter(
        (s) =>
          s.name.includes(keyword) || s.address.includes(keyword)
      )
    : mockStores;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.header}>
        <Text style={styles.title}>附近门店</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索门店名称或地址..."
          placeholderTextColor="#94A3B8"
          value={keyword}
          onChangeText={setKeyword}
        />
      </View>

      {/* Store List */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {filteredStores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>未找到匹配的门店</Text>
            <Text style={styles.emptyHint}>尝试其他关键词</Text>
          </View>
        ) : (
          filteredStores.map(store => (
            <TouchableOpacity key={store.id} style={styles.storeCard}>
              <View style={styles.storeHeader}>
                <Text style={styles.storeName}>{store.name}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {store.rating}</Text>
                </View>
              </View>
              <Text style={styles.storeAddress}>{store.address}</Text>
              <View style={styles.storeFooter}>
                <Text style={styles.distance}>📍 {store.distance}</Text>
                <View style={styles.services}>
                  {store.services.map(s => (
                    <View key={s} style={styles.serviceTag}>
                      <Text style={styles.serviceText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#8B5CF6', padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 12, paddingHorizontal: 16, height: 48 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1E293B' },
  storeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  storeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: 16, fontWeight: '700', color: '#1E293B', flex: 1 },
  ratingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  storeAddress: { fontSize: 14, color: '#64748B', marginTop: 8 },
  storeFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  distance: { fontSize: 13, color: '#64748B' },
  services: { flexDirection: 'row', gap: 8 },
  serviceTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  serviceText: { fontSize: 12, color: '#64748B' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyHint: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
});
