/**
 * websocket.ts - Phase-21 T60 + T61
 * WebSocket 客户端 (实时事件订阅 + 聊天)
 *
 * 双模式:
 * - EventBus: 业务事件订阅 (订单/营销)
 * - Chat: 双向消息 (T61)
 *
 * 自动重连: 指数退避 (1s, 2s, 4s, 8s, 16s, 30s)
 * 心跳: 30s ping/pong
 */
import { v4 as uuidv4 } from 'uuid';

export type WSConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'closed';

export type WSMessageType =
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe'
  | 'event'
  | 'chat'
  | 'ack'
  | 'error';

export interface WSMessage {
  id: string;
  type: WSMessageType;
  /** 主题 (用于事件订阅,如 'order.created') */
  topic?: string;
  /** 消息体 */
  payload?: unknown;
  ts: string;
}

export interface WSOptions {
  url: string;
  /** 心跳间隔 (ms) */
  heartbeatMs?: number;
  /** 重连最大延迟 (ms) */
  maxReconnectMs?: number;
  /** 自定义发送函数 (测试 mock) */
  sender?: (msg: WSMessage) => void;
  /** 重连触发器 (测试 mock) */
  reconnecter?: () => void;
}

export type EventHandler = (msg: WSMessage) => void;

export class WebSocketClient {
  private state: WSConnectionState = 'disconnected';
  private readonly subscriptions = new Map<string, Set<EventHandler>>();
  private readonly listeners = new Map<string, Set<EventHandler>>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private sentMessages: WSMessage[] = [];
  private receivedMessages: WSMessage[] = [];

  private readonly heartbeatMs: number;
  private readonly maxReconnectMs: number;
  private readonly sender: (msg: WSMessage) => void;
  private readonly reconnecter: () => void;

  constructor(private readonly options: WSOptions) {
    this.heartbeatMs = options.heartbeatMs ?? 30 * 1000;
    this.maxReconnectMs = options.maxReconnectMs ?? 30 * 1000;
    this.sender = options.sender ?? (() => {});
    this.reconnecter = options.reconnecter ?? (() => {});
  }

  // ── Connection ──

  connect(): void {
    if (this.state === 'connected' || this.state === 'connecting') return;
    this.state = 'connecting';
    // 真实场景: 创建 WebSocket 实例
    // 模拟: 直接进入 connected 状态
    this.handleOpen();
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.state = 'closed';
  }

  private handleOpen(): void {
    this.state = 'connected';
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    // 重连后重新订阅
    for (const topic of this.subscriptions.keys()) {
      this.send({ id: uuidv4(), type: 'subscribe', topic, ts: this.now() });
    }
  }

  /** 接收消息 (从 socket 入口) */
  receive(msg: WSMessage): void {
    this.receivedMessages.push(msg);
    // pong 自动回复
    if (msg.type === 'ping') {
      this.send({ id: uuidv4(), type: 'pong', ts: this.now() });
      return;
    }
    // 派发给订阅者
    if (msg.topic) {
      const subs = this.subscriptions.get(msg.topic);
      if (subs) {
        for (const h of subs) h(msg);
      }
    }
    // 派发给全局监听者
    const all = this.listeners.get('*');
    if (all) {
      for (const h of all) h(msg);
    }
  }

  /** 模拟连接断开 → 触发重连 */
  simulateDisconnect(): void {
    this.stopHeartbeat();
    this.state = 'reconnecting';
    this.reconnectAttempts += 1;
    this.reconnecter();
    // 模拟重连延迟后再次连接
    const delay = this.calcBackoff();
    setTimeout(() => {
      if (this.state !== 'closed') this.handleOpen();
    }, delay);
  }

  private calcBackoff(): number {
    return Math.min(
      this.maxReconnectMs,
      1000 * Math.pow(2, Math.max(0, this.reconnectAttempts - 1)),
    );
  }

  // ── Subscription ──

  subscribe(topic: string, handler: EventHandler): () => void {
    let set = this.subscriptions.get(topic);
    if (!set) {
      set = new Set();
      this.subscriptions.set(topic, set);
      // 首次订阅时通知服务端
      this.send({ id: uuidv4(), type: 'subscribe', topic, ts: this.now() });
    }
    set.add(handler);
    return () => {
      set!.delete(handler);
      if (set!.size === 0) {
        this.subscriptions.delete(topic);
        this.send({ id: uuidv4(), type: 'unsubscribe', topic, ts: this.now() });
      }
    };
  }

  /** 全局监听 (所有消息) */
  onAny(handler: EventHandler): () => void {
    let set = this.listeners.get('*');
    if (!set) {
      set = new Set();
      this.listeners.set('*', set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  // ── Send ──

  send(msg: WSMessage): void {
    this.sentMessages.push(msg);
    this.sender(msg);
  }

  /** 发送业务事件订阅消息 */
  publish(topic: string, payload: unknown): void {
    this.send({
      id: uuidv4(),
      type: 'event',
      topic,
      payload,
      ts: this.now(),
    });
  }

  /** 发送聊天消息 (T61) */
  sendChat(channel: string, text: string, senderId: string): WSMessage {
    const msg: WSMessage = {
      id: uuidv4(),
      type: 'chat',
      topic: `chat.${channel}`,
      payload: { text, senderId, channel },
      ts: this.now(),
    };
    this.send(msg);
    return msg;
  }

  // ── Heartbeat ──

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ id: uuidv4(), type: 'ping', ts: this.now() });
    }, this.heartbeatMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ── Query ──

  getState(): WSConnectionState {
    return this.state;
  }

  getSentMessages(): WSMessage[] {
    return [...this.sentMessages];
  }

  getReceivedMessages(): WSMessage[] {
    return [...this.receivedMessages];
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // ── Test helpers ──
  resetForTests(): void {
    this.stopHeartbeat();
    this.state = 'disconnected';
    this.subscriptions.clear();
    this.listeners.clear();
    this.reconnectAttempts = 0;
    this.sentMessages = [];
    this.receivedMessages = [];
  }

  private now(): string {
    return new Date().toISOString();
  }
}