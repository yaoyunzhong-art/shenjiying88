import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './common/Card';

interface InventoryCardProps {
  skuId: string;
  title: string;
  quantity: number;
  lowStockThreshold?: number;
  unit?: string;
  location?: string;
  onPress?: () => void;
}

export function InventoryCard({
  skuId,
  title,
  quantity,
  lowStockThreshold = 10,
  unit = '件',
  location,
  onPress,
}: InventoryCardProps) {
  const isLowStock = quantity <= lowStockThreshold;
  const isOutOfStock = quantity === 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {isOutOfStock ? (
            <View style={[styles.tag, styles.outOfStockTag]}>
              <Text style={styles.outOfStockText}>缺货</Text>
            </View>
          ) : isLowStock ? (
            <View style={[styles.tag, styles.lowStockTag]}>
              <Text style={styles.lowStockText}>库存预警</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>SKU</Text>
            <Text style={styles.infoValue}>{skuId}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>库存数量</Text>
            <Text
              style={[
                styles.infoValue,
                styles.quantityValue,
                isLowStock && styles.lowStockValue,
                isOutOfStock && styles.outOfStockValue,
              ]}
            >
              {quantity} {unit}
            </Text>
          </View>
          {location && (
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>存放位置</Text>
              <Text style={styles.infoValue}>{location}</Text>
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowStockTag: {
    backgroundColor: '#FF950020',
  },
  lowStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  outOfStockTag: {
    backgroundColor: '#FF3B3020',
  },
  outOfStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
  body: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoColumn: {
    minWidth: '40%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
  },
  quantityValue: {
    fontWeight: '600',
  },
  lowStockValue: {
    color: '#FF9500',
  },
  outOfStockValue: {
    color: '#FF3B30',
  },
});
