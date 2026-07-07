/**
 * api.ts - Phase-21 T54
 * 网络层 - Axios 实例 + 拦截器
 *
 * 功能:
 * - 自动附加 Authorization 头
 * - 401 自动 refresh token
 * - 请求/响应日志
 * - 错误统一处理
 */
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../store/authStore';
import { Platform } from 'react-native';

/** API 基础 URL - 根据平台/环境配置 */
const getBaseURL = (): string => {
  // Android 模拟器:10.0.2.2 映射到宿主机 localhost
  if (Platform.OS === 'android' && __DEV__) {
    return 'http://10.0.2.2:3000/api';
  }
  return __DEV__ ? 'http://localhost:3000/api' : 'https://api.shenjiying.com/api';
};

/** 防止 refresh token 无限循环 */
let isRefreshing = false;
let refreshSubscribers: Array<(newToken: string) => void> = [];

function subscribeTokenRefresh(cb: (newToken: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

/** Axios 实例 */
export const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 15 * 1000,
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
    'X-App-Version': '1.0.0',
  },
});

// ── Request 拦截器:附加 token ──

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.log(`[api] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response 拦截器:401 自动 refresh ──

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // 等待新 token
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            if (original.headers) {
              original.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${getBaseURL()}/auth/refresh`, {
          refreshToken,
        });

        const newToken = data.token;
        useAuthStore.getState().login({
          user: useAuthStore.getState().user!,
          token: newToken,
          refreshToken: data.refreshToken ?? refreshToken,
        });

        onRefreshed(newToken);
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(original);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (__DEV__) {
      console.warn(
        `[api] ${original.method?.toUpperCase()} ${original.url} failed:`,
        error.response?.status,
        error.message,
      );
    }
    return Promise.reject(error);
  },
);

/** 业务错误类型 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 统一错误转换 */
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data: any = error.response?.data;
    return new ApiError(
      status,
      data?.code ?? 'UNKNOWN',
      data?.message ?? error.message,
      data,
    );
  }
  if (error instanceof Error) return new ApiError(0, 'INTERNAL', error.message);
  return new ApiError(0, 'UNKNOWN', String(error));
}