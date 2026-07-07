/**
 * 推送通知服务
 * Push Notification Service
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type NotificationType = 
  | 'order_created'
  | 'order_paid'
  | 'order_refunded'
  | 'coupon_expiring'
  | 'member_upgrade'
  | 'device_alert'
  | 'handoff_reminder'
  | 'shift_reminder';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: boolean;
  badge?: number;
}

class PushNotificationService {
  private notificationListeners: Notifications.Subscription[] = [];

  // 配置通知处理方式
  configure() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  // 请求权限
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('orders', {
        name: '订单通知',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('alerts', {
        name: '告警通知',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  }

  // 获取 Expo Push Token
  async getPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // 替换为实际 projectId
      });
      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // 发送本地通知
  async sendLocalNotification(payload: NotificationPayload): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: payload.sound ?? true,
          badge: payload.badge,
        },
        trigger: null, // 立即发送
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      return null;
    }
  }

  // 发送订单通知
  async notifyOrderCreated(orderId: string, orderNo: string): Promise<string | null> {
    return this.sendLocalNotification({
      title: '📋 新订单',
      body: `订单 ${orderNo} 已创建，请及时处理`,
      data: { type: 'order_created', orderId, orderNo },
      sound: true,
      badge: 1,
    });
  }

  // 支付成功通知
  async notifyOrderPaid(orderId: string, orderNo: string, amount: number): Promise<string | null> {
    return this.sendLocalNotification({
      title: '✅ 支付成功',
      body: `订单 ${orderNo} 支付 ¥${amount.toFixed(2)} 成功`,
      data: { type: 'order_paid', orderId, orderNo, amount },
      sound: true,
    });
  }

  // 退款通知
  async notifyOrderRefunded(orderId: string, orderNo: string, amount: number): Promise<string | null> {
    return this.sendLocalNotification({
      title: '↩️ 退款完成',
      body: `订单 ${orderNo} 已退款 ¥${amount.toFixed(2)}`,
      data: { type: 'order_refunded', orderId, orderNo, amount },
      sound: true,
    });
  }

  // 优惠券即将过期提醒
  async notifyCouponExpiring(couponName: string, daysLeft: number): Promise<string | null> {
    return this.sendLocalNotification({
      title: '🎫 优惠券即将过期',
      body: `您的 "${couponName}" 还有 ${daysLeft} 天过期，请尽快使用`,
      data: { type: 'coupon_expiring', couponName, daysLeft },
      sound: true,
    });
  }

  // 会员升级通知
  async notifyMemberUpgrade(tierName: string): Promise<string | null> {
    return this.sendLocalNotification({
      title: '🎉 会员升级',
      body: `恭喜！您已升级为 ${tierName} 会员`,
      data: { type: 'member_upgrade', tierName },
      sound: true,
    });
  }

  // 设备告警通知
  async notifyDeviceAlert(deviceName: string, alertType: string): Promise<string | null> {
    const channelId = Platform.OS === 'android' ? 'alerts' : 'default';
    return this.sendLocalNotification({
      title: '🚨 设备告警',
      body: `${deviceName} 发生 ${alertType}，请及时处理`,
      data: { type: 'device_alert', deviceName, alertType },
      sound: true,
      badge: 1,
    });
  }

  // 交接班提醒
  async notifyHandoffReminder(storeName: string, time: string): Promise<string | null> {
    return this.sendLocalNotification({
      title: '🔄 交接班提醒',
      body: `${storeName} 请在 ${time} 进行交接班`,
      data: { type: 'handoff_reminder', storeName, time },
      sound: true,
    });
  }

  // 排班提醒
  async notifyShiftReminder(storeName: string, shiftTime: string): Promise<string | null> {
    return this.sendLocalNotification({
      title: '📅 排班提醒',
      body: `您有一班 ${shiftTime} 在 ${storeName}`,
      data: { type: 'shift_reminder', storeName, shiftTime },
      sound: true,
    });
  }

  // 添加通知监听器
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    const subscription = Notifications.addNotificationReceivedListener(callback);
    this.notificationListeners.push(subscription);
    return subscription;
  }

  // 添加点击监听器
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    this.notificationListeners.push(subscription);
    return subscription;
  }

  // 移除所有监听器
  removeAllListeners(): void {
    this.notificationListeners.forEach((listener) => listener.remove());
    this.notificationListeners = [];
  }

  // 清除徽章
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // 获取未读通知数量
  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  // 设置徽章数量
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // 取消所有已调度的通知
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // 取消特定通知
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
}

export const pushNotificationService = new PushNotificationService();
