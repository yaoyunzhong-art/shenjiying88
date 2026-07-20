import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useSession, useAppContext } from '../../context/AppContext';

export function MemberProfileScreen() {
  const navigation = useNavigation();
  const session = useSession();
  const { logout } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(session.nickname ?? '');
  const [phone, setPhone] = useState('138****8888');

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert('提示', '保存成功');
  };

  const handleLogout = () => {
    Alert.alert('提示', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>加载中...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>数据获取失败: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {session.nickname?.charAt(0).toUpperCase() ?? 'M'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Text style={styles.editAvatarText}>编辑</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.memberId}>会员ID: {session.memberId ?? 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>
        <Card style={styles.formCard}>
          <Input
            label="昵称"
            placeholder="请输入昵称"
            value={nickname}
            onChangeText={setNickname}
            editable={isEditing}
          />
          <Input
            label="手机号"
            placeholder="请输入手机号"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={isEditing}
          />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>会员等级</Text>
            <View
              style={[
                styles.tierBadge,
                {
                  backgroundColor:
                    session.memberTier === 'SVIP'
                      ? '#FF950020'
                      : '#007AFF20',
                },
              ]}
            >
              <Text
                style={[
                  styles.tierText,
                  {
                    color:
                      session.memberTier === 'SVIP' ? '#FF9500' : '#007AFF',
                  },
                ]}
              >
                {session.memberTier === 'SVIP'
                  ? 'SVIP'
                  : session.memberTier === 'MEMBER'
                    ? '会员'
                    : '游客'}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>账户设置</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔐</Text>
            <Text style={styles.menuText}>修改密码</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>通知设置</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📍</Text>
            <Text style={styles.menuText}>收货地址</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        {isEditing ? (
          <Button title="保存修改" onPress={handleSave} />
        ) : (
          <Button
            title="编辑资料"
            onPress={() => setIsEditing(true)}
            variant="outline"
          />
        )}
      </View>

      <View style={styles.section}>
        <Button
          title="退出登录"
          onPress={handleLogout}
          variant="ghost"
          textStyle={styles.logoutText}
        />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  editAvatarText: {
    fontSize: 12,
    color: '#666666',
  },
  memberId: {
    fontSize: 13,
    color: '#999999',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  formCard: {
    padding: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 15,
    color: '#333333',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuCard: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 48,
  },
  logoutText: {
    color: '#FF3B30',
  },
  bottomPadding: {
    height: 100,
  },
  permissionText: {
    color: '#333333',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
