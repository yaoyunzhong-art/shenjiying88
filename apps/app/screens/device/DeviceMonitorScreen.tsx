import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const mockDevices = [
  { id: '1', name: '门闸 A-01', type: 'gate', status: 'online', lastSync: '刚刚' },
  { id: '2', name: 'POS终端 A-01', type: 'pos', status: 'online', lastSync: '5分钟前' },
  { id: '3', name: '扫码枪 A-02', type: 'scanner', status: 'offline', lastSync: '2小时前' },
  { id: '4', name: '打印机 B-01', type: 'printer', status: 'error', lastSync: '昨天' },
  { id: '5', name: '门闸 A-02', type: 'gate', status: 'online', lastSync: '刚刚' },
];

const statusConfig = {
  online: { label: '在线', color: '#10B981' },
  offline: { label: '离线', color: '#64748B' },
  error: { label: '故障', color: '#EF4444' },
};

export function DeviceMonitorScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>设备监控</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ 添加设备</Text>
        </TouchableOpacity>
      </View>

      {/* 状态概览 */}
      <View style={styles.statusRow}>
        <View style={[styles.statusCard, { backgroundColor: '#10B981' }]}>
          <Text style={styles.statusCount}>3</Text>
          <Text style={styles.statusLabel}>在线</Text>
        </View>
        <View style={[styles.statusCard, { backgroundColor: '#64748B' }]}>
          <Text style={styles.statusCount}>1</Text>
          <Text style={styles.statusLabel}>离线</Text>
        </View>
        <View style={[styles.statusCard, { backgroundColor: '#EF4444' }]}>
          <Text style={styles.statusCount}>1</Text>
          <Text style={styles.statusLabel}>故障</Text>
        </View>
      </View>

      {/* 告警 */}
      <View style={styles.alertBanner}>
        <Text style={styles.alertEmoji}>⚠️</Text>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>打印机 B-01 缺纸</Text>
          <Text style={styles.alertTime}>5分钟前</Text>
        </View>
        <TouchableOpacity style={styles.alertAction}>
          <Text style={styles.alertActionText}>处理</Text>
        </TouchableOpacity>
      </View>

      {/* 设备列表 */}
      <Text style={styles.sectionTitle}>设备列表</Text>
      {mockDevices.map(device => {
        const config = statusConfig[device.status as keyof typeof statusConfig];
        return (
          <TouchableOpacity key={device.id} style={styles.deviceCard}>
            <View style={[styles.deviceIcon, { backgroundColor: device.status === 'online' ? '#ECFDF5' : device.status === 'offline' ? '#F1F5F9' : '#FEF2F2' }]}>
              <Text style={styles.deviceEmoji}>
                {device.type === 'gate' ? '🚪' : device.type === 'pos' ? '💳' : device.type === 'scanner' ? '📷' : '🖨️'}
              </Text>
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceSync}>最后同步: {device.lastSync}</Text>
            </View>
            <View style={[styles.deviceStatus, { backgroundColor: config.color + '20' }]}>
              <Text style={[styles.deviceStatusText, { color: config.color }]}>{config.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#1E40AF', padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statusRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statusCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statusCount: { fontSize: 28, fontWeight: '700', color: '#fff' },
  statusLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', margin: 16, marginTop: 0, padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  alertEmoji: { fontSize: 24, marginRight: 12 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: '600', color: '#92400E' },
  alertTime: { fontSize: 13, color: '#B45309', marginTop: 2 },
  alertAction: { backgroundColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  alertActionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  deviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
  deviceIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  deviceEmoji: { fontSize: 24 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  deviceSync: { fontSize: 13, color: '#64748B', marginTop: 4 },
  deviceStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deviceStatusText: { fontSize: 13, fontWeight: '600' },
});
