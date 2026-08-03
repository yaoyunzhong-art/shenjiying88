import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';

export function HandoffScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState('¥3,580');
  const [orderCount, setOrderCount] = useState('86');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.centerText}>加载中...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.centerText}>数据获取失败: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>交接班</Text>
        <Text style={styles.subtitle}>早班 → 中班</Text>
      </View>

      {/* 交接班次信息 */}
      <View style={styles.shiftCard}>
        <View style={styles.shiftRow}>
          <View style={styles.shiftInfo}>
            <Text style={styles.shiftLabel}>交班人</Text>
            <Text style={styles.shiftValue}>张店长</Text>
          </View>
          <Text style={styles.shiftArrow}>→</Text>
          <View style={styles.shiftInfo}>
            <Text style={styles.shiftLabel}>接班人</Text>
            <Text style={styles.shiftValue}>李店长</Text>
          </View>
        </View>
        <View style={styles.shiftTime}>
          <Text style={styles.shiftTimeLabel}>交班时间</Text>
          <Text style={styles.shiftTimeValue}>14:00</Text>
        </View>
      </View>

      {/* 营业数据 */}
      <Text style={styles.sectionTitle}>本班营业数据</Text>
      <View style={styles.dataCard}>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>收款总额</Text>
          <Text style={styles.dataValue}>¥12,580.50</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>订单数量</Text>
          <Text style={styles.dataValue}>{orderCount} 笔</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>现金收款</Text>
          <Text style={styles.dataValue}>{cashAmount}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>微信/支付宝</Text>
          <Text style={styles.dataValue}>¥8,280.50</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>会员消费</Text>
          <Text style={styles.dataValue}>¥1,720.00</Text>
        </View>
      </View>

      {/* 现金交接 */}
      <Text style={styles.sectionTitle}>现金交接</Text>
      <View style={styles.cashCard}>
        <View style={styles.cashRow}>
          <Text style={styles.cashLabel}>本班现金收入</Text>
          <Text style={styles.cashValue}>¥3,580</Text>
        </View>
        <View style={styles.cashRow}>
          <Text style={styles.cashLabel}>上次结存</Text>
          <Text style={styles.cashValue}>¥5,000</Text>
        </View>
        <View style={[styles.cashRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 12 }]}>
          <Text style={[styles.cashLabel, { fontWeight: '700' }]}>应交现金</Text>
          <Text style={[styles.cashValue, { color: '#10B981', fontWeight: '700' }]}>¥8,580</Text>
        </View>
      </View>

      {/* 备注 */}
      <Text style={styles.sectionTitle}>交接备注</Text>
      <View style={styles.noteCard}>
        <TextInput
          style={styles.noteInput}
          placeholder="请输入需要交接的事项..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          value={note}
          onChangeText={setNote}
        />
      </View>

      {/* 确认按钮 */}
      <TouchableOpacity
        style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
        onPress={() => {
          if (submitting) return;
          setSubmitting(true);
          setTimeout(() => setSubmitting(false), 1500);
        }}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.confirmBtnText}>确认交接</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn}>
        <Text style={styles.cancelBtnText}>取消</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#1E40AF', padding: 20, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: '#93C5FD', marginTop: 4 },
  shiftCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  shiftInfo: { alignItems: 'center' },
  shiftLabel: { fontSize: 13, color: '#64748B' },
  shiftValue: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  shiftArrow: { fontSize: 24, color: '#1E40AF', marginHorizontal: 40 },
  shiftTime: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  shiftTimeLabel: { fontSize: 14, color: '#64748B' },
  shiftTimeValue: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginHorizontal: 20, marginTop: 16, marginBottom: 12 },
  dataCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  dataLabel: { fontSize: 15, color: '#64748B' },
  dataValue: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  cashCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16 },
  cashRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  cashLabel: { fontSize: 15, color: '#64748B' },
  cashValue: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  noteCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16 },
  noteInput: { fontSize: 15, color: '#1E293B', minHeight: 100, textAlignVertical: 'top' },
  confirmBtn: { backgroundColor: '#10B981', marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { padding: 16, alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 16 },
  centerText: { fontSize: 16, color: '#64748B', textAlign: 'center', marginTop: 100 },
});
