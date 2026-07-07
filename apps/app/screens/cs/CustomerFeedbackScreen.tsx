import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../components/common/Card';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FeedbackCategory =
  | 'service'
  | 'product'
  | 'environment'
  | 'staff'
  | 'other';

export interface FeedbackFormData {
  category: FeedbackCategory;
  title: string;
  description: string;
  contactPhone: string;
  rating: number;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  contactPhone?: string;
  rating?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string }[] = [
  { value: 'service', label: '服务质量' },
  { value: 'product', label: '商品质量' },
  { value: 'environment', label: '门店环境' },
  { value: 'staff', label: '员工服务' },
  { value: 'other', label: '其他' },
];

const RATING_LABELS = ['非常差', '较差', '一般', '较好', '非常好'];

const INITIAL_FORM: FeedbackFormData = {
  category: 'service',
  title: '',
  description: '',
  contactPhone: '',
  rating: 5,
};

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

function validateForm(data: FeedbackFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.title.trim()) {
    errors.title = '请输入反馈标题';
  } else if (data.title.trim().length < 2) {
    errors.title = '标题至少2个字符';
  } else if (data.title.trim().length > 50) {
    errors.title = '标题不超过50个字符';
  }

  if (!data.description.trim()) {
    errors.description = '请输入反馈详情';
  } else if (data.description.trim().length < 10) {
    errors.description = '详情至少10个字符';
  } else if (data.description.trim().length > 500) {
    errors.description = '详情不超过500个字符';
  }

  if (data.contactPhone && !/^1[3-9]\d{9}$/.test(data.contactPhone.trim())) {
    errors.contactPhone = '请输入正确的手机号码';
  }

  if (data.rating < 1 || data.rating > 5) {
    errors.rating = '评分范围为1-5';
  }

  return errors;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useFeedbackSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const submit = useCallback(
    async (data: FeedbackFormData): Promise<boolean> => {
      setIsSubmitting(true);
      setSubmitError(null);
      setIsSuccess(false);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // Simulate random failure for error handling test
        if (Math.random() < 0.1) {
          throw new Error('网络异常，请稍后重试');
        }

        setIsSuccess(true);
        return true;
      } catch (err: any) {
        const msg =
          err?.message || '提交失败，请稍后重试';
        setSubmitError(msg);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setIsSuccess(false);
  }, []);

  return { isSubmitting, submitError, isSuccess, submit, reset };
}

/* ------------------------------------------------------------------ */
/*  Screen Component                                                   */
/* ------------------------------------------------------------------ */

export function CustomerFeedbackScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState<FeedbackFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const { isSubmitting, submitError, isSuccess, submit, reset } =
    useFeedbackSubmit();

  const updateField = useCallback(
    <K extends keyof FeedbackFormData>(field: K, value: FeedbackFormData[K]) => {
      const next = { ...form, [field]: value };
      setForm(next);
      // Re-validate touched fields
      if (touched.has(field)) {
        setErrors(validateForm(next));
      }
    },
    [form, touched],
  );

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => new Set(prev).add(field));
  }, []);

  const handleBlur = useCallback(
    (field: string) => {
      markTouched(field);
      setErrors(validateForm(form));
    },
    [form, markTouched],
  );

  const handleSubmit = useCallback(async () => {
    // Touch all fields
    const allFields = new Set([
      'title',
      'description',
      'contactPhone',
      'rating',
    ]);
    setTouched(allFields);

    const validation = validateForm(form);
    setErrors(validation);

    if (Object.keys(validation).length > 0) return;

    const ok = await submit(form);
    if (ok) {
      Alert.alert('提交成功', '感谢您的反馈，我们将尽快处理！', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
    }
  }, [form, submit, navigation]);

  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    setTouched(new Set());
    reset();
  }, [reset]);

  /* ---------- Render ---------- */

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category Selection */}
        <Card padding={16} style={styles.section}>
          <Text style={styles.sectionTitle}>反馈类型</Text>
          <View style={styles.categoryRow}>
            {CATEGORY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.categoryChip,
                  form.category === opt.value && styles.categoryChipActive,
                ]}
                onPress={() => {
                  updateField('category', opt.value);
                  markTouched('category');
                }}
                accessibilityRole="button"
                accessibilityLabel={`反馈类型: ${opt.label}`}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    form.category === opt.value &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Rating */}
        <Card padding={16} style={styles.section}>
          <Text style={styles.sectionTitle}>评分</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  updateField('rating', star);
                  markTouched('rating');
                }}
                onBlur={() => handleBlur('rating')}
                accessibilityRole="adjustable"
                accessibilityLabel={`评分 ${star} - ${RATING_LABELS[star - 1]}`}
              >
                <Text
                  style={[
                    styles.star,
                    star <= form.rating ? styles.starActive : styles.starInactive,
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.ratingLabel}>
              {RATING_LABELS[form.rating - 1]}
            </Text>
          </View>
          {errors.rating && (
            <Text style={styles.errorText}>{errors.rating}</Text>
          )}
        </Card>

        {/* Title */}
        <Card padding={16} style={styles.section}>
          <Text style={styles.sectionTitle}>
            标题 <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title ? styles.inputError : undefined]}
            placeholder="请输入反馈标题"
            placeholderTextColor="#999"
            value={form.title}
            onChangeText={(v) => updateField('title', v)}
            onBlur={() => handleBlur('title')}
            maxLength={50}
            accessibilityLabel="反馈标题"
          />
          {errors.title && (
            <Text style={styles.errorText}>{errors.title}</Text>
          )}
          <Text style={styles.charCount}>{form.title.length}/50</Text>
        </Card>

        {/* Description */}
        <Card padding={16} style={styles.section}>
          <Text style={styles.sectionTitle}>
            详细描述 <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              errors.description ? styles.inputError : undefined,
            ]}
            placeholder="请输入反馈详情（至少10个字符）"
            placeholderTextColor="#999"
            value={form.description}
            onChangeText={(v) => updateField('description', v)}
            onBlur={() => handleBlur('description')}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
            accessibilityLabel="反馈详情"
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
          <Text style={styles.charCount}>
            {form.description.length}/500
          </Text>
        </Card>

        {/* Contact Phone */}
        <Card padding={16} style={styles.section}>
          <Text style={styles.sectionTitle}>联系电话（选填）</Text>
          <TextInput
            style={[styles.input, errors.contactPhone ? styles.inputError : undefined]}
            placeholder="请输入手机号"
            placeholderTextColor="#999"
            value={form.contactPhone}
            onChangeText={(v) => updateField('contactPhone', v)}
            onBlur={() => handleBlur('contactPhone')}
            keyboardType="phone-pad"
            maxLength={11}
            accessibilityLabel="联系电话"
          />
          {errors.contactPhone && (
            <Text style={styles.errorText}>{errors.contactPhone}</Text>
          )}
        </Card>

        {/* Error message */}
        {submitError && (
          <Card padding={16} style={styles.errorCard}>
            <Text style={styles.errorCardText}>{submitError}</Text>
          </Card>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="提交反馈"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>提交反馈</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="重置表单"
          >
            <Text style={styles.resetButtonText}>重置</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },

  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  required: { color: '#E53935', fontWeight: '700' },

  /* Category chips */
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#1976D2',
    fontWeight: '600',
  },

  /* Rating */
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: { fontSize: 32, marginRight: 2 },
  starActive: { color: '#FFB300' },
  starInactive: { color: '#E0E0E0' },
  ratingLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },

  /* Inputs */
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FFF',
  },
  inputError: { borderColor: '#E53935' },
  textArea: { minHeight: 120 },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },

  /* Error */
  errorText: { color: '#E53935', fontSize: 13, marginTop: 4 },
  errorCard: { backgroundColor: '#FFEBEE', marginBottom: 12 },
  errorCardText: { color: '#C62828', fontSize: 14 },

  /* Buttons */
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButton: { backgroundColor: '#1976D2' },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  resetButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD' },
  resetButtonText: { color: '#666', fontSize: 16 },
});
