import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface OrderListStatePanelProps {
  icon: string;
  title?: string;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function OrderListStatePanel({
  icon,
  title,
  message,
  actionLabel,
  onActionPress,
}: OrderListStatePanelProps) {
  const isError = Boolean(title);

  return (
    <View style={isError ? styles.errorContainer : styles.emptyContainer}>
      <Text style={styles.icon}>{icon}</Text>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={isError ? styles.errorMessage : styles.emptyText}>{message}</Text>
      {actionLabel && onActionPress ? (
        <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
