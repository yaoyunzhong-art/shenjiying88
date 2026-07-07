# Anti-pattern · WebSocket 状态机 stale 连接

## ❌ 错误
```typescript
export class WebSocketClient {
  private state: 'connected' = 'connected';
  private ws: WebSocket;

  connect() {
    this.ws = new WebSocket(URL);
    this.ws.onopen = () => { this.state = 'connected'; };
    // 缺少 onclose / onerror 处理
    // 缺少心跳 ping/pong
    // 缺少重连机制
  }
}
```

## 问题
- 网络切换 (WiFi → 4G) 后 ws 已死,但 state 仍显示 connected
- 心跳缺失,中间代理 (nginx) idle timeout 后断连不知
- 重连缺失,需要用户手动刷新页面
- 状态机不完整,无法表达 reconnecting/closed 中间态

## ✅ 正确
```typescript
export type WSConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'closed';

export class WebSocketClient {
  private state: WSConnectionState = 'disconnected';
  private heartbeatTimer: NodeJS.Timeout | null = null;

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.state === 'connected') this.send({ type: 'ping', ts: Date.now() });
    }, 30000);
  }

  private scheduleReconnect() {
    if (this.state === 'closed') return;
    this.state = 'reconnecting';
    setTimeout(() => this.connect(), Math.min(2 ** this.reconnectAttempts * 1000, 30000));
  }

  simulateDisconnect() {
    this.ws?.close(); // 触发 scheduleReconnect
  }
}
```

## 教训
- 5 状态机必备: disconnected/connecting/connected/reconnecting/closed
- 心跳 30s + 指数退避重连 (1s→30s 上限)
- `simulateDisconnect()` 单测断线重连,不用真拔网线
- `closed` 是终态,需用户手动 retry (避免无限重连)
