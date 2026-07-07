/**
 * ProfileScreen.tsx - Phase-21 T52
 * 个人中心页
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';

export const ProfileScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name ?? '未登录'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        <Text style={styles.role}>{user?.role ?? ''}</Text>
      </View>

      <View style={styles.menu}>
        <MenuItem label="设备管理" />
        <MenuItem label="消息中心" />
        <MenuItem label="关于" />
        <MenuItem label="切换租户" />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
};

const MenuItem: React.FC<{ label: string }> = ({ label }) => (
  <TouchableOpacity style={styles.menuItem}>
    <Text style={styles.menuLabel}>{label}</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '600', marginTop: 16 },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  role: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#dbeafe',
    borderRadius: 4,
  },
  menu: { marginTop: 16, backgroundColor: '#fff' },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuLabel: { fontSize: 16 },
  menuArrow: { fontSize: 20, color: '#999' },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});