import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Card } from './common/Card';
import type {
  OrderDetailSection,
  OrderDetailSectionValueTone,
} from '../utils/order-detail-sections';

interface OrderDetailSectionBlockProps {
  section: OrderDetailSection;
  containerStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  titlePlacement?: 'outside' | 'inside';
}

function getValueToneStyle(tone?: OrderDetailSectionValueTone): TextStyle | undefined {
  switch (tone) {
    case 'success':
      return styles.valueSuccess;
    case 'warning':
      return styles.valueWarning;
    case 'info':
      return styles.valueInfo;
    default:
      return undefined;
  }
}

export function OrderDetailSectionBlock({
  section,
  containerStyle,
  cardStyle,
  titlePlacement = 'outside',
}: OrderDetailSectionBlockProps) {
  return (
    <View style={containerStyle}>
      {titlePlacement === 'outside' ? (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      ) : null}
      <Card style={cardStyle}>
        {titlePlacement === 'inside' ? (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        ) : null}
        {section.rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.key}>{row.label}</Text>
            <Text style={[styles.value, getValueToneStyle(row.valueTone)]}>{row.value}</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  key: {
    fontSize: 14,
    color: '#666666',
  },
  value: {
    fontSize: 14,
    color: '#333333',
  },
  valueSuccess: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  valueWarning: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  valueInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5856D6',
  },
});
