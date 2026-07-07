/**
 * push.ts - Phase-21 T59
 * 推送通知集成 (FCM + Notifee)
 *
 * 双通道:
 * - FCM (Android + iOS 远程推送)
 * - Notifee (本地通知 + iOS 展示增强)
 */
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

/** 推送 token (FCM/APNs) */
let pushToken: string | null = null;

export function getPushToken(): string | null {
  return pushToken;
}

/** 请求权限 (Android 13+/iOS) */
async function requestPermission(): Promise<boolean> {
  // Android 13+ POST_NOTIFICATIONS
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  // iOS / 老 Android
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/** 初始化通知渠道 (Android) */
async function createChannel(): Promise<string> {
  return notifee.createChannel({
    id: 'shenjiying-default',
    name: '神机营 默认',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}

/** 应用启动时调用 */
export async function setupNotifications(): Promise<void> {
  const granted = await requestPermission();
  if (!granted) {
    console.warn('[push] permission denied');
    return;
  }

  await createChannel();

  // 注册 FCM token
  pushToken = await messaging().getToken();
  console.log('[push] FCM token:', pushToken);

  // 监听 token 刷新
  messaging().onTokenRefresh((newToken) => {
    pushToken = newToken;
    // TODO: 上报到后端
    console.log('[push] token refreshed:', newToken);
  });

  // 前台消息 → Notifee 本地展示
  messaging().onMessage(async (remoteMessage) => {
    console.log('[push] foreground message:', remoteMessage);
    await notifee.displayNotification({
      title: remoteMessage.notification?.title ?? '神机营',
      body: remoteMessage.notification?.body ?? '',
      android: {
        channelId: 'shenjiying-default',
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
      },
      ios: {
        sound: 'default',
      },
      data: remoteMessage.data,
    });
  });

  // 后台消息 → 自动展示 (Android) / 静默 (iOS)
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[push] background message:', remoteMessage);
    return Promise.resolve();
  });

  // 用户点击通知
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('[push] opened from background:', remoteMessage);
    // TODO: 导航到对应页面
  });

  // 杀死状态点击
  const initialNotification = await messaging().getInitialNotification();
  if (initialNotification) {
    console.log('[push] opened from quit state:', initialNotification);
  }
}

/** 主动发送本地通知 (用于业务事件触发) */
export async function showLocalNotification(input: {
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  await notifee.displayNotification({
    title: input.title,
    body: input.body,
    android: {
      channelId: 'shenjiying-default',
      smallIcon: 'ic_notification',
      pressAction: { id: 'default' },
    },
    ios: { sound: 'default' },
    data: input.data,
  });
}