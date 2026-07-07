import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

interface Staff {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinDate: string;
}

const mockStaffList: Staff[] = [
  {
    id: 'staff-001',
    name: '李明',
    phone: '138****1234',
    role: '店长',
    status: 'ACTIVE',
    joinDate: '2024-01-15',
  },
  {
    id: 'staff-002',
    name: '王芳',
    phone: '139****5678',
    role: '收银员',
    status: 'ACTIVE',
    joinDate: '2024-03-20',
  },
  {
    id: 'staff-003',
    name: '张伟',
    phone: '137****9012',
    role: '咖啡师',
    status: 'ACTIVE',
    joinDate: '2024-05-10',
  },
  {
    id: 'staff-004',
    name: '刘洋',
    phone: '136****3456',
    role: '服务员',
    status: 'INACTIVE',
    joinDate: '2024-02-28',
  },
];

const roleOptions = ['店长', '收银员', '咖啡师', '服务员', '管理员'];

export function StaffManageScreen() {
  const [staffList, setStaffList] = useState<Staff[]>(mockStaffList);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', role: '' });

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.phone || !newStaff.role) {
      Alert.alert('提示', '请填写完整信息');
      return;
    }
    const staff: Staff = {
      id: `staff-${Date.now()}`,
      name: newStaff.name,
      phone: newStaff.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      role: newStaff.role,
      status: 'ACTIVE',
      joinDate: new Date().toISOString().split('T')[0]!,
    };
    setStaffList((prev) => [staff, ...prev]);
    setNewStaff({ name: '', phone: '', role: '' });
    setShowAddModal(false);
    Alert.alert('提示', '员工添加成功');
  };

  const handleToggleStatus = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((staff) =>
        staff.id === staffId
          ? {
              ...staff,
              status: staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            }
          : staff
      )
    );
  };

  const handleDeleteStaff = (staffId: string) => {
    Alert.alert('提示', '确定要删除该员工吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          setStaffList((prev) => prev.filter((staff) => staff.id !== staffId));
        },
      },
    ]);
  };

  const renderStaffItem = ({ item }: { item: Staff }) => (
    <Card style={styles.staffCard}>
      <View style={styles.staffHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.staffInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.staffName}>{item.name}</Text>
            <View
              style={[
                styles.statusBadge,
                item.status === 'ACTIVE' ? styles.activeBadge : styles.inactiveBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.status === 'ACTIVE' ? styles.activeText : styles.inactiveText,
                ]}
              >
                {item.status === 'ACTIVE' ? '在职' : '离职'}
              </Text>
            </View>
          </View>
          <Text style={styles.staffRole}>{item.role}</Text>
          <Text style={styles.staffPhone}>{item.phone}</Text>
        </View>
      </View>
      <View style={styles.staffFooter}>
        <Text style={styles.joinDate}>入职日期: {item.joinDate}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(item.id)}
          >
            <Text
              style={[
                styles.actionText,
                item.status === 'ACTIVE' ? styles.disableText : styles.enableText,
              ]}
            >
              {item.status === 'ACTIVE' ? '停用' : '启用'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteStaff(item.id)}
          >
            <Text style={styles.deleteText}>删除</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyText}>暂无员工</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>员工列表</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>新增员工</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={staffList}
        renderItem={renderStaffItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新增员工</Text>
            <Input
              label="姓名"
              placeholder="请输入员工姓名"
              value={newStaff.name}
              onChangeText={(text) => setNewStaff((prev) => ({ ...prev, name: text }))}
            />
            <Input
              label="手机号"
              placeholder="请输入手机号"
              value={newStaff.phone}
              onChangeText={(text) => setNewStaff((prev) => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
            <Text style={styles.roleLabel}>职位</Text>
            <View style={styles.roleOptions}>
              {roleOptions.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    newStaff.role === role && styles.roleOptionSelected,
                  ]}
                  onPress={() => setNewStaff((prev) => ({ ...prev, role }))}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      newStaff.role === role && styles.roleOptionTextSelected,
                    ]}
                  >
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <Button
                title="取消"
                onPress={() => {
                  setNewStaff({ name: '', phone: '', role: '' });
                  setShowAddModal(false);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="确认添加"
                onPress={handleAddStaff}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  staffCard: {
    padding: 16,
    marginBottom: 12,
  },
  staffHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  staffInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#34C75920',
  },
  inactiveBadge: {
    backgroundColor: '#99999920',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeText: {
    color: '#34C759',
  },
  inactiveText: {
    color: '#999999',
  },
  staffRole: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: 13,
    color: '#999999',
  },
  staffFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  joinDate: {
    fontSize: 12,
    color: '#999999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  enableText: {
    color: '#34C759',
  },
  disableText: {
    color: '#FF9500',
  },
  deleteText: {
    fontSize: 13,
    color: '#FF3B30',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roleOptionSelected: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  roleOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
