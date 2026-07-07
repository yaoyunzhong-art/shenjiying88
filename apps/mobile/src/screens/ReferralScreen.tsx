/**
 * ReferralScreen.tsx
 * 推荐线索表单页 - 导购员提交推荐线索
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

interface FormErrors {
  name?: string;
  phone?: string;
  interest?: string;
}

export const ReferralScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = '请输入客户姓名';
    if (!phone.trim()) e.phone = '请输入联系电话';
    else if (!/^1\d{10}$/.test(phone.trim())) e.phone = '手机号格式不正确';
    if (!interest.trim()) e.interest = '请描述客户意向';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    // 模拟提交
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setInterest('');
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>推荐提交成功</Text>
        <Text style={styles.successDesc}>
          客户 {name} 的线索已录入，销售团队将尽快跟进。
        </Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>继续推荐</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>推荐新客户</Text>
      <Text style={styles.subtitle}>填写以下信息提交推荐线索</Text>

      <View style={styles.field}>
        <Text style={styles.label}>客户姓名 *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="请输入客户姓名"
          placeholderTextColor="#999"
          value={name}
          onChangeText={(t) => { setName(t); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>联系电话 *</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          placeholder="请输入手机号码"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          maxLength={11}
          value={phone}
          onChangeText={(t) => { setPhone(t); if (errors.phone) setErrors((p) => ({ ...p, phone: undefined })); }}
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>意向说明 *</Text>
        <TextInput
          style={[styles.input, styles.textarea, errors.interest && styles.inputError]}
          placeholder="请描述客户意向，如：想了解会员卡充值优惠、关注门店活动等"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={interest}
          onChangeText={(t) => { setInterest(t); if (errors.interest) setErrors((p) => ({ ...p, interest: undefined })); }}
        />
        {errors.interest && <Text style={styles.errorText}>{errors.interest}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitBtnText}>
          {submitting ? '提交中...' : '提交推荐'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },
  inputError: { borderColor: '#ef4444' },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 32,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  successDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  resetBtn: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  resetBtnText: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
});
