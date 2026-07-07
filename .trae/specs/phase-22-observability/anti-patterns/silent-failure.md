# Anti-pattern · 静默失败 (Silent Failure)

## ❌ 错误
```typescript
try {
  await sendEmail(user);
} catch (err) {
  // 静默吞掉异常
  console.log('email failed');
}

// 或者
try {
  await fetch(external);
} catch (err) {
  // 只 log 不上报
  logger.error('fetch failed', err);
}
```

## 问题
- 错误未上报到 Sentry / Alertmanager,运维不知情
- console.log 在生产可能被截断或丢弃
- 业务方发现"功能坏了"时已经过 N 小时
- 没有 trace 上下文,排查耗时

## ✅ 正确
```typescript
try {
  await sendEmail(user);
} catch (err) {
  // 1. 上报到 Sentry (带 context)
  sentry.captureException(err, {
    tenantId: ctx.tenantId,
    userId: user.id,
    tags: { action: 'send_email', template: 'welcome' },
  });
  // 2. 记录指标 (失败计数)
  metrics.incrementCounter('email_send_failures_total', { reason: err.code });
  // 3. 决定是否重试 / 降级
  if (isRetryable(err)) {
    await retryQueue.push({ userId: user.id, template: 'welcome' });
  }
  // 4. 让上层决定是否抛出 (不要静默)
  throw err;
}
```

## 教训
- 每个 catch 块必须有: 上报 / 指标 / 重试决策 / 重新抛出 (之一或多个)
- T69 Sentry 集成: 业务代码可以一行 captureException,但必须有这行
- Alertmanager 默认规则覆盖主要场景,但业务特定失败需要自定义 metric
