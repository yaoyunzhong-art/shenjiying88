/**
 * push.test.ts - Phase-21 T59
 * 推送通知集成 (FCM + Notifee) 单元测试
 *
 * push 模块内部维护一个 module-scoped pushToken 变量。
 * 每个测试通过 import 获得同一引用; pushToken 在模块加载时初始化为 null。
 * 由于 fn 级 mock 可配置,我们保留一个模块引用,但注意 pushToken 不会被重置。
 * 测试顺序: 先测初始 null,再测 setupNotifications 后的非 null 状态。
 *
 * ⚠️ 所有依赖 setupNotifications 的测试共享模块状态。对于验证初始状态的测试,
 * 它必须作为文件第一个 test。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Shared mocking using vi.hoisted ──
const requestPermission = vi.hoisted(() => vi.fn());
const getToken = vi.hoisted(() => vi.fn());
const onTokenRefresh = vi.hoisted(() => vi.fn());
const onMessage = vi.hoisted(() => vi.fn());
const setBackgroundMessageHandler = vi.hoisted(() => vi.fn());
const onNotificationOpenedApp = vi.hoisted(() => vi.fn());
const getInitialNotification = vi.hoisted(() => vi.fn());

const messagingFn: any = vi.hoisted(() => {
  const fn: any = () => ({
    requestPermission,
    getToken,
    onTokenRefresh,
    onMessage,
    setBackgroundMessageHandler,
    onNotificationOpenedApp,
    getInitialNotification,
  });
  fn.AuthorizationStatus = {
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
  };
  return fn;
});

vi.mock('@react-native-firebase/messaging', () => ({
  default: messagingFn,
}));

const notifeeCreateChannel = vi.hoisted(() => vi.fn());
const notifeeDisplayNotification = vi.hoisted(() => vi.fn());

vi.mock('@notifee/react-native', () => ({
  default: {
    createChannel: notifeeCreateChannel,
    displayNotification: notifeeDisplayNotification,
  },
  AndroidImportance: { HIGH: 4, DEFAULT: 3, LOW: 2, NONE: 0 },
}));

// Mock react-native for Platform tests
vi.mock('react-native', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    Platform: { OS: 'ios', Version: '17.0', select: (obj: any) => obj.ios || obj.default, isTesting: true },
    PermissionsAndroid: {
      request: vi.fn(),
      PERMISSIONS: { POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS' },
      RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
    },
  };
});

describe('push.ts · Phase-21 T59', () => {
  let pushModule: any;

  // Load module once for all tests (shared pushToken state)
  beforeAll(async () => {
    pushModule = await import('./push');
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════
  //  第 1 组: 初始状态 (必须最先运行)
  // ═══════════════════════════════════════════

  it('getPushToken: returns null before setupNotifications is ever called', () => {
    // This MUST be the first test in this file.
    // pushToken is initialized to null at module load time.
    expect(pushModule.getPushToken()).toBeNull();
  });

  // ═══════════════════════════════════════════
  //  第 2 组: 正例 — 授予权限后的完整初始化
  // ═══════════════════════════════════════════

  it('setupNotifications: requests permission and gets FCM token', async () => {
    requestPermission.mockResolvedValue(2); // AUTHORIZED
    getToken.mockResolvedValue('fcm_token_abc');
    getInitialNotification.mockResolvedValue(null);

    await pushModule.setupNotifications();

    expect(requestPermission).toHaveBeenCalled();
    expect(getToken).toHaveBeenCalled();
    expect(notifeeCreateChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'shenjiying-default' }),
    );
  });

  it('setupNotifications: registers all required message handlers', async () => {
    requestPermission.mockResolvedValue(2);
    getToken.mockResolvedValue('token');
    getInitialNotification.mockResolvedValue(null);

    await pushModule.setupNotifications();

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(setBackgroundMessageHandler).toHaveBeenCalledTimes(1);
    expect(onNotificationOpenedApp).toHaveBeenCalledTimes(1);
    expect(onTokenRefresh).toHaveBeenCalledTimes(1);
  });

  it('setupNotifications: getPushToken returns the stored FCM token', async () => {
    requestPermission.mockResolvedValue(2);
    getToken.mockResolvedValue('fcm_token_stored');
    getInitialNotification.mockResolvedValue(null);

    await pushModule.setupNotifications();
    expect(pushModule.getPushToken()).toBe('fcm_token_stored');
  });

  // ═══════════════════════════════════════════
  //  第 3 组: showLocalNotification
  // ═══════════════════════════════════════════

  it('showLocalNotification: displays notification with title, body and data', async () => {
    await pushModule.showLocalNotification({
      title: '新订单',
      body: '您有一个新订单 #1024',
      data: { orderId: '1024', type: 'new_order' },
    });

    expect(notifeeDisplayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '新订单',
        body: '您有一个新订单 #1024',
        data: { orderId: '1024', type: 'new_order' },
      }),
    );
  });

  it('showLocalNotification: works without optional data field', async () => {
    await pushModule.showLocalNotification({
      title: '提醒',
      body: '纯文本通知',
    });

    expect(notifeeDisplayNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: '提醒', body: '纯文本通知' }),
    );
  });

  // ═══════════════════════════════════════════
  //  第 4 组: 边界 — 权限拒绝
  // ═══════════════════════════════════════════

  it('setupNotifications: skips FCM registration when permission DENIED', async () => {
    requestPermission.mockResolvedValue(1); // DENIED
    await pushModule.setupNotifications();

    expect(getToken).not.toHaveBeenCalled();
    expect(notifeeCreateChannel).not.toHaveBeenCalled();
  });

  it('setupNotifications: skips FCM registration when permission NOT_DETERMINED', async () => {
    requestPermission.mockResolvedValue(0);
    await pushModule.setupNotifications();

    expect(getToken).not.toHaveBeenCalled();
    expect(notifeeCreateChannel).not.toHaveBeenCalled();
  });

  // ═══════════════════════════════════════════
  //  第 5 组: 边界 — 多次调用
  // ═══════════════════════════════════════════

  it('setupNotifications: calling twice does not throw', async () => {
    requestPermission.mockResolvedValue(2);
    getToken.mockResolvedValue('token_multi');
    getInitialNotification.mockResolvedValue(null);

    // Should not throw from double setup
    await pushModule.setupNotifications();
    await pushModule.setupNotifications();
  });

  // ═══════════════════════════════════════════
  //  第 6 组: 边界 — Token 刷新回调
  // ═══════════════════════════════════════════

  it('setupNotifications: onTokenRefresh callback updates pushToken', async () => {
    requestPermission.mockResolvedValue(2);
    getToken.mockResolvedValue('initial_token');
    getInitialNotification.mockResolvedValue(null);

    await pushModule.setupNotifications();

    const refreshCallback = onTokenRefresh.mock.calls[0][0];
    refreshCallback('refreshed_token_999');

    expect(pushModule.getPushToken()).toBe('refreshed_token_999');
  });

  // ═══════════════════════════════════════════
  //  第 7 组: 防御 — 前台消息处理
  // ═══════════════════════════════════════════

  it('onMessage: calls notifee.displayNotification with full notification', async () => {
    requestPermission.mockResolvedValue(2);
    getToken.mockResolvedValue('token');
    getInitialNotification.mockResolvedValue(null);

    await pushModule.setupNotifications();

    const handler = onMessage.mock.calls[0][0];
    await handler({
      notification: { title: '订单通知', body: '新订单已创建' },
      data: { orderId: '1024' },
    });

    expect(notifeeDisplayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '订单通知',
        body: '新订单已创建',
        data: { orderId: '1024' },
      }),
    );
  });

  it('onMessage: uses fallback title/body when notification is undefined', async () => {
    requestPermission.mockResolvedValue(2);
    getToken.mockResolvedValue('token');
    getInitialNotification.mockResolvedValue(null);

    await pushModule.setupNotifications();

    const handler = onMessage.mock.calls[0][0];
    await handler({ notification: undefined, data: {} });

    expect(notifeeDisplayNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: '神机营', body: '' }),
    );
  });

  it('onMessage: uses fallback when notification has no title/body', async () => {
    requestPermission.mockResolvedValue(2);
    getToken.mockResolvedValue('token');
    getInitialNotification.mockResolvedValue(null);

    await pushModule.setupNotifications();

    const handler = onMessage.mock.calls[0][0];
    await handler({ notification: { title: undefined, body: undefined }, data: {} });

    expect(notifeeDisplayNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: '神机营', body: '' }),
    );
  });

  // ═══════════════════════════════════════════
  //  第 8 组: 防御 — Background 消息
  // ═══════════════════════════════════════════

  it('background message handler: is registered and executes without error', async () => {
    requestPermission.mockResolvedValue(2);
    getToken.mockResolvedValue('token');
    getInitialNotification.mockResolvedValue(null);

    await pushModule.setupNotifications();

    const bgHandler = setBackgroundMessageHandler.mock.calls[0][0];
    const result = await bgHandler({ notification: { title: 'BG' } });
    // Background handler is typically a no-op or displays notification
    // Just verify it doesn't throw
    expect(result).toBeUndefined();
  });
});
