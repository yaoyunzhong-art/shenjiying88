/**
 * api.test.ts - Phase-21 T54
 * 网络层 - Axios 实例 + 拦截器 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Interceptors are registered at module import time via api.interceptors.request.use / response.use
// We verify their behavior by directly testing the exported pure functions (ApiError, toApiError)
// and verifying that interceptors are wired up by checking the exposed api instance.

// To test interceptors, we need to capture the handlers. The trick:
// 1. vi.mock axios so api.interceptors gets our mock interceptor
// 2. Use a global (module-scope) variable that both vi.mock factory and test can access

// Global bridge variable set by vi.mock factory, read by test
let capturedInterceptors: {
  requestFulfilled?: Function;
  requestRejected?: Function;
  responseFulfilled?: Function;
  responseRejected?: Function;
} = {};

vi.mock('axios', () => {
  // These are fresh vi.fn() per module evaluation
  const reqFulfilled = vi.fn();
  const reqRejected = vi.fn();
  const resFulfilled = vi.fn();
  const resRejected = vi.fn();

  capturedInterceptors = {
    requestFulfilled: reqFulfilled,
    requestRejected: reqRejected,
    responseFulfilled: resFulfilled,
    responseRejected: resRejected,
  };

  return {
    default: {
      create: () => ({
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: {
            use: (fulfilled: Function, rejected: Function) => {
              reqFulfilled.mockImplementation(fulfilled);
              reqRejected.mockImplementation(rejected);
            },
          },
          response: {
            use: (fulfilled: Function, rejected: Function) => {
              resFulfilled.mockImplementation(fulfilled);
              resRejected.mockImplementation(rejected);
            },
          },
        },
        defaults: { headers: { common: {} } },
      }),
      isAxiosError: (e: unknown) => (e as any)?.isAxiosError === true,
    },
    AxiosError: class AxiosErrorMock extends Error {
      isAxiosError = true;
      response: any;
      constructor(message?: string) {
        super(message ?? '');
        this.name = 'AxiosError';
      }
    },
  };
});

// ── Mock authStore ──
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockGetState = vi.fn();

vi.mock('../store/authStore', () => ({
  useAuthStore: {
    getState: () => mockGetState(),
  },
}));

describe('api.ts · Phase-21 T54', () => {
  let ApiError: any;
  let toApiError: any;
  let reqFulfilled: Function;
  let reqRejected: Function;
  let resFulfilled: Function;
  let resRejected: Function;

  beforeAll(async () => {
    const mod = await import('./api');
    ApiError = mod.ApiError;
    toApiError = mod.toApiError;

    // Read captured interceptors after import
    if (capturedInterceptors.requestFulfilled) {
      // The captured fn wraps the actual handler via mockImplementation — call it
      // to get the real handler reference
      reqFulfilled = capturedInterceptors.requestFulfilled;
      reqRejected = capturedInterceptors.requestRejected!;
      resFulfilled = capturedInterceptors.responseFulfilled;
      resRejected = capturedInterceptors.responseRejected!;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetState.mockReturnValue({
      token: 'test_token_abc',
      refreshToken: 'test_refresh_xyz',
      user: { id: 'u001', name: '张三', role: 'admin', tenantId: 'ten001' },
      login: mockLogin,
      logout: mockLogout,
    });
  });

  // ── 正例: Interceptors 注册 ──

  it('registers request and response interceptors on import', () => {
    expect(reqFulfilled).toBeDefined();
    expect(reqRejected).toBeDefined();
    expect(resFulfilled).toBeDefined();
    expect(resRejected).toBeDefined();
  });

  it('request interceptor: attaches Authorization header when token exists', () => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const result = reqFulfilled(config);
    expect(result.headers.Authorization).toBe('Bearer test_token_abc');
  });

  it('request interceptor: does not attach Authorization when token is null', () => {
    mockGetState.mockReturnValue({ token: null, refreshToken: null, user: null });
    const config = { headers: {} };
    const result = reqFulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('request interceptor: rejects with the same error when config is broken', async () => {
    const error = new Error('Config broken');
    // The request error handler returns Promise.reject(error)
    await expect(reqRejected(error)).rejects.toThrow('Config broken');
  });

  // ── 正例: ApiError class ──

  it('ApiError: creates error with correct properties', () => {
    const err = new ApiError(400, 'VALIDATION_ERROR', 'Invalid input', { field: 'email' });
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid input');
    expect(err.details).toEqual({ field: 'email' });
    expect(err.name).toBe('ApiError');
  });

  it('ApiError: defaults details to undefined when omitted', () => {
    const err = new ApiError(500, 'SERVER_ERROR', 'Internal error');
    expect(err.details).toBeUndefined();
  });

  it('ApiError: works with numeric status code 0', () => {
    const err = new ApiError(0, 'UNKNOWN', 'Something went wrong');
    expect(err.status).toBe(0);
    expect(err.code).toBe('UNKNOWN');
  });

  // ── 正例: toApiError ──

  it('toApiError: converts AxiosError with full response data', () => {
    const err = {
      isAxiosError: true,
      response: { status: 422, data: { code: 'INVALID_EMAIL', message: '邮箱格式不正确' } },
      message: 'Request failed',
    };
    const result = toApiError(err);
    expect(result).toBeInstanceOf(ApiError);
    expect(result.status).toBe(422);
    expect(result.code).toBe('INVALID_EMAIL');
    expect(result.message).toBe('邮箱格式不正确');
  });

  it('toApiError: converts AxiosError with status but no response data', () => {
    const err = {
      isAxiosError: true,
      response: { status: 504, data: undefined },
      message: 'Gateway Timeout',
    };
    const result = toApiError(err);
    expect(result.status).toBe(504);
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('Gateway Timeout');
  });

  it('toApiError: converts generic Error with custom message', () => {
    const result = toApiError(new Error('Network failure'));
    expect(result.status).toBe(0);
    expect(result.code).toBe('INTERNAL');
    expect(result.message).toBe('Network failure');
  });

  // ── 边界: Response error handler ──

  it('response error handler: passes through non-401 errors', async () => {
    const error = {
      isAxiosError: true,
      response: { status: 403 },
      message: 'Forbidden',
      config: { url: '/api/test', method: 'GET', headers: {} },
    };
    await expect(resRejected(error)).rejects.toBe(error);
  });

  it('response error handler: rejects 401 with no refreshToken', async () => {
    mockGetState.mockReturnValue({
      token: 'old_token', refreshToken: null,
      user: { id: 'u001', name: '张三', role: 'admin', tenantId: 'ten001' },
      login: mockLogin, logout: mockLogout,
    });
    const error = {
      isAxiosError: true,
      response: { status: 401 },
      message: 'Unauthorized',
      config: { url: '/api/protected', method: 'GET', headers: {}, _retry: false },
    };
    await expect(resRejected(error)).rejects.toThrow();
    expect(mockLogout).toHaveBeenCalled();
  });

  it('response error handler: rejects 401 when authStore token is null', async () => {
    mockGetState.mockReturnValue({
      token: null, refreshToken: null,
      user: null, login: mockLogin, logout: mockLogout,
    });
    const error = {
      isAxiosError: true,
      response: { status: 401 },
      message: 'Unauthorized',
      config: { url: '/api/protected', method: 'GET', headers: {}, _retry: false },
    };
    await expect(resRejected(error)).rejects.toThrow();
  });

  // ── 边界: toApiError with edge cases ──

  it('toApiError: handles AxiosError with no response (network error)', () => {
    const err = { isAxiosError: true, response: undefined, message: 'Network Error' };
    const result = toApiError(err);
    expect(result.status).toBe(0);
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('Network Error');
  });

  // ── 防御: toApiError with non-standard inputs ──

  it('toApiError: handles null gracefully', () => {
    const result = toApiError(null);
    expect(result.status).toBe(0);
    expect(result.code).toBe('UNKNOWN');
  });

  it('toApiError: handles plain string', () => {
    const result = toApiError('unexpected error string');
    expect(result.status).toBe(0);
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('unexpected error string');
  });

  it('toApiError: handles Error without isAxiosError flag', () => {
    const result = toApiError({ custom: 'error', message: 'custom msg' });
    // Not an AxiosError, not a plain Error with instanceof, falls to else branch
    expect(result.status).toBe(0);
    expect(result.code).toBe('UNKNOWN');
  });
});
