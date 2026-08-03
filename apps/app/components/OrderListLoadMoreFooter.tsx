import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface OrderListLoadMoreFooterProps {
  visible: boolean;
  loading: boolean;
  onPress: () => void;
}

export function OrderListLoadMoreFooter({
  visible,
  loading,
  onPress,
}: OrderListLoadMoreFooterProps) {
  if (!visible) {
    return <View style={styles.spacer} />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '加载中...' : '加载更多'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
  },
  spacer: {
    height: 12,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 14,
    color: '#344054',
    fontWeight: '600',
  },
});
