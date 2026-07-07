import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAppContext } from '../../context/AppContext';
import { createNativeSession } from '../../market-bootstrap';

export function MemberLoginScreen() {
  const navigation = useNavigation();
  const { login } = useAppContext();
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = () => {
    if (!phone) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
    Alert.alert('提示', '验证码已发送');
  };

  const handleLogin = async () => {
    if (!phone) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    if (!verificationCode) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    setLoading(true);
    try {
      const session = createNativeSession('MEMBER');
      login(session);
      navigation.goBack();
    } catch {
      Alert.alert('错误', '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>会员登录</Text>
          <Text style={styles.subtitle}>输入手机号登录会员账号</Text>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="手机号"
            placeholder="请输入手机号"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={11}
          />
          <Input
            label="验证码"
            placeholder="请输入验证码"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Button
            title="发送验证码"
            onPress={handleSendCode}
            variant="outline"
            style={styles.sendCodeButton}
          />
          <Button
            title="登录"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />
        </Card>

        <View style={styles.agreement}>
          <Text style={styles.agreementText}>
            登录即表示同意
            <Text style={styles.agreementLink}>《用户协议》</Text>
            和
            <Text style={styles.agreementLink}>《隐私政策》</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
  },
  formCard: {
    padding: 20,
  },
  sendCodeButton: {
    marginTop: -8,
    marginBottom: 24,
  },
  loginButton: {
    marginTop: 8,
  },
  agreement: {
    marginTop: 20,
    alignItems: 'center',
  },
  agreementText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  agreementLink: {
    color: '#007AFF',
  },
});
