/**
 * LoginScreen.tsx - Phase-21 T52
 * 登录页 - 邮箱/密码 + 租户选择
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { api, toApiError } from '../network/api';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请输入邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login({ user: data.user, token: data.token, refreshToken: data.refreshToken });
    } catch (err) {
      const apiErr = toApiError(err);
      Alert.alert('登录失败', `${apiErr.code}: ${apiErr.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>神机营</Text>
      <Text style={styles.subtitle}>门店 · 会员 · 营销 一体化</Text>

      <TextInput
        style={styles.input}
        placeholder="邮箱"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="密码"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>登录</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    marginBottom: 32,
  },
  input: {
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  button: {
    height: 48,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});