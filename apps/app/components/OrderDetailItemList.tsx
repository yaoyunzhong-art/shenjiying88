import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Card } from './common/Card';
import type { OrderDetailItemRow } from '../utils/order-detail-items';

interface OrderDetailItemListProps {
  title: string;
  items: OrderDetailItemRow[];
  containerStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
}

export function OrderDetailItemList({
  title,
  items,
  containerStyle,
  cardStyle,
}: OrderDetailItemListProps) {
  return (
    <View style={containerStyle}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card style={cardStyle}>
        {items.map((item) => (
          <View key={item.key}>
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSku}>{item.skuLabel}</Text>
              </View>
              <View style={styles.itemPrice}>
                <Text style={styles.itemPriceText}>{item.priceLabel}</Text>
                <Text style={styles.itemQuantity}>{item.quantityLabel}</Text>
              </View>
            </View>
            {item.showDivider ? <View style={styles.itemDivider} /> : null}
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: '#999999',
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  itemPriceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
});
