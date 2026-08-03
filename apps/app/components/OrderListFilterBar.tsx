import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface OrderListFilterOption<T extends string> {
  id: T;
  label: string;
}

interface OrderListFilterBarProps<T extends string> {
  options: Array<OrderListFilterOption<T>>;
  activeOption: T;
  onChange: (next: T) => void;
  variant?: 'primary' | 'chip';
}

export function OrderListFilterBar<T extends string>({
  options,
  activeOption,
  onChange,
  variant = 'primary',
}: OrderListFilterBarProps<T>) {
  const isChip = variant === 'chip';

  return (
    <View style={isChip ? styles.chipContainer : styles.primaryContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            isChip ? styles.chipTab : styles.primaryTab,
            activeOption === option.id && (isChip ? styles.chipTabActive : styles.primaryTabActive),
          ]}
          onPress={() => onChange(option.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              isChip ? styles.chipTabText : styles.primaryTabText,
              activeOption === option.id && (isChip ? styles.chipTabTextActive : styles.primaryTabTextActive),
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  primaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  primaryTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  primaryTabActive: {
    backgroundColor: '#007AFF',
  },
  primaryTabText: {
    fontSize: 14,
    color: '#666666',
  },
  primaryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  chipTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F2F4F7',
  },
  chipTabActive: {
    backgroundColor: '#E8F1FF',
  },
  chipTabText: {
    fontSize: 12,
    color: '#667085',
  },
  chipTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
