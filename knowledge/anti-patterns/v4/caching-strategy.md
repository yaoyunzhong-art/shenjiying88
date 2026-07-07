# 反模式库 v4 · caching-strategy (缓存策略)

> **创建时间**: 2026-06-27 23:08 CST (1h 冲刺 Part 10)
> **分类**: 性能 · 缓存
> **目标读者**: 后端工程师 + 全栈 + SRE

---

## 0. 缓存核心原则

**Cache-Aside Pattern** 是事实标准:
1. **Read**: 先读缓存,命中返回;未命中读 DB,写回缓存
2. **Write**: 写 DB + **失效缓存** (不是更新缓存)

```
✅ 正确: Cache-Aside (lazy load) + 失效而非更新
❌ 错误: 同步双写 / Read-Through / Write-Through 不分场景
```

---

## 1. ❌ 反模式 1: 缓存雪崩 (Cache Stampede)

```typescript
// BAD: 100 个 key 同一时刻过期
const keys = await db.product.findMany();
for (const product of keys) {
  await redis.setex(`product:${product.id}`, 3600, JSON.stringify(product));
}
// 所有 cache 都在同一秒过期 → 下秒 100% 请求穿透到 DB
```

**现象**: 缓存 TTL 同一时刻 → 雪崩 → DB QPS 暴增 → 雪崩 → 服务宕机

### ✅ 最佳实践: TTL 随机化 + 永不过期后台刷新

```typescript
// GOOD: TTL 加 ±10% 随机抖动
function randomTtl(baseTtl: number): number {
  const jitter = Math.floor(baseTtl * 0.1);  // ±10%
  return baseTtl + Math.floor(Math.random() * jitter * 2 - jitter);
}

const ttl = randomTtl(3600);  // 3240-3960 秒
await redis.setex(`product:${product.id}`, ttl, JSON.stringify(product));

// 或更激进: 永不过期 + 后台异步刷新
async function getProduct(id: string) {
  const cached = await redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);

  const fresh = await db.product.findUnique({ where: { id } });
  if (!fresh) return null;

  await redis.set(`product:${id}`, JSON.stringify(fresh));  // 无 TTL
  // 后台任务: 检测快过期 → 异步刷新
  return fresh;
}
```

**效果**:
- TTL 雪崩概率 0%
- 永不过期方案: 后台任务扫描 5min 内被访问的 key → 异步刷新

---

## 2. ❌ 反模式 2: 缓存穿透 (Cache Penetration)

```typescript
// BAD: 攻击者用不存在的 ID 请求
// GET /api/products/99999999 (不存在)
// → 缓存 miss → DB query → DB miss → 返回 null
// 攻击者 1 万 QPS → DB 1 万次无效查询 → DB 撑爆
```

### ✅ 最佳实践: 布隆过滤器 + 空值缓存

```typescript
// GOOD: 布隆过滤器拦截不存在的 key
import { BloomFilter } from 'bloomfilter';

const bloom = new BloomFilter(1_000_000, 0.01);  // 100 万容量,1% 误判率

// 启动时加载所有 product ID
const allIds = await db.product.findMany({ select: { id: true } });
for (const { id } of allIds) bloom.add(id);

async function getProduct(id: string) {
  if (!bloom.has(id)) {
    return null;  // 一定不存在,直接返回
  }

  const cached = await redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);

  const fresh = await db.product.findUnique({ where: { id } });
  if (!fresh) {
    // 空值也缓存 (短 TTL,防穿透)
    await redis.setex(`product:${id}`, 60, JSON.stringify({ __notFound: true }));
    return null;
  }

  await redis.setex(`product:${id}`, randomTtl(3600), JSON.stringify(fresh));
  return fresh;
}
```

**效果**:
- 布隆过滤器拦截 99% 不存在的 key
- 空值缓存拦截剩余 1%
- DB QPS 攻击 1 万 → 实际打到 DB < 10

---

## 3. ❌ 反模式 3: 缓存击穿 (Hotspot Invalidation)

```typescript
// BAD: 明星商品 (Hot key) 过期瞬间 → 1 万并发打到 DB
const product = await redis.get(`product:hot-iphone-15`);
// expired → 1 万并发同时 query DB → DB 撑爆
```

### ✅ 最佳实践: 互斥锁 + singleflight

```typescript
// GOOD: 分布式锁,只让 1 个请求查 DB,其他等待
import Redlock from 'redlock';
const redlock = new Redlock([redis]);

async function getProduct(id: string) {
  const cached = await redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);

  // 尝试获取分布式锁 (最多等 100ms)
  let lock;
  try {
    lock = await redlock.acquire([`locks:product:${id}`], 100);
  } catch (e) {
    // 抢锁失败,短暂等待后重试缓存
    await new Promise(r => setTimeout(r, 50));
    return getProduct(id);  // 递归,此时缓存已写入
  }

  try {
    const fresh = await db.product.findUnique({ where: { id } });
    if (!fresh) return null;
    await redis.setex(`product:${id}`, randomTtl(3600), JSON.stringify(fresh));
    return fresh;
  } finally {
    await lock.release();
  }
}
```

**Node.js 单进程方案**: `promise-singleflight` (类似 Go singleflight)

```typescript
import { Singleflight } from 'promise-singleflight';
const sf = new Singleflight<string>();

async function getProduct(id: string) {
  return sf.do(`product:${id}`, async () => {
    // 1000 个并发同时进 → 只查 DB 1 次
    const fresh = await db.product.findUnique({ where: { id } });
    if (!fresh) return null;
    await redis.setex(`product:${id}`, randomTtl(3600), JSON.stringify(fresh));
    return fresh;
  });
}
```

---

## 4. ❌ 反模式 4: 数据不一致 (Cache-DB Drift)

```typescript
// BAD: 先更新缓存,再更新 DB (顺序错!)
async updateProduct(id: string, data: ProductUpdate) {
  // 步骤 1: 更新缓存
  const product = await db.product.findUnique({ where: { id } });
  const updated = { ...product, ...data };
  await redis.setex(`product:${id}`, 3600, JSON.stringify(updated));

  // 步骤 2: 更新 DB
  await db.product.update({ where: { id }, data });

  // 问题: 步骤 1 成功后,步骤 2 失败 → 缓存是新的,DB 是旧的 → 永久不一致
}
```

### ✅ 最佳实践: 先 DB 后缓存 (Cache-Aside 失效模式)

```typescript
// GOOD: 先更新 DB,再失效缓存
async updateProduct(id: string, data: ProductUpdate) {
  // 步骤 1: 更新 DB
  await db.product.update({ where: { id }, data });

  // 步骤 2: 失效缓存 (不是更新)
  await redis.del(`product:${id}`);

  // 下次读 cache miss → 重新从 DB 加载 → 一致性保证
}

// 进阶: 延迟双删 (防止并发读写短暂不一致)
async updateProduct(id: string, data: ProductUpdate) {
  await redis.del(`product:${id}`);  // 第一次删除
  await db.product.update({ where: { id }, data });
  await new Promise(r => setTimeout(r, 500));  // 等 500ms
  await redis.del(`product:${id}`);  // 第二次删除 (覆盖期间写入的脏数据)
}
```

**为什么失效而非更新**:
- 更新缓存 = 多个写并发 → 后写覆盖先写 → 脏数据
- 失效缓存 = 下次读时 reload → 永远拿到最新数据

---

## 5. ❌ 反模式 5: 大 key 阻塞

```typescript
// BAD: 缓存整个 100 MB JSON
const allUsers = await db.user.findMany();  // 1 万用户
await redis.set('users:all', JSON.stringify(allUsers));  // 100 MB

// 问题:
// 1. 一次 GET 100 MB → 网络阻塞 5 秒
// 2. Redis 单线程 → 其他请求全卡
// 3. 内存爆 → OOM
```

### ✅ 最佳实践: 分片 + 压缩 + 字段裁剪

```typescript
// GOOD 1: 列表分页缓存
async function getUserList(page: number, pageSize: number) {
  const cacheKey = `users:list:${page}:${pageSize}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const users = await db.user.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: { id: true, name: true, avatar: true },  // 只缓存必要字段
  });

  await redis.setex(cacheKey, randomTtl(300), JSON.stringify(users));
  return users;
}

// GOOD 2: 大对象用 Hash 分字段
await redis.hset(`user:${user.id}`, {
  id: user.id,
  name: user.name,
  avatar: user.avatar,
  email: user.email,
});
// HMGET 只取需要字段,不全量加载

// GOOD 3: 压缩
import zlib from 'zlib';
const compressed = zlib.gzipSync(JSON.stringify(data));
await redis.set(key, compressed);  // 100 MB → 10 MB
```

---

## 6. ❌ 反模式 6: 缓存无降级

```typescript
// BAD: Redis 挂了 = 整个服务挂
async function getProduct(id: string) {
  const cached = await redis.get(`product:${id}`);  // ❌ Redis 挂 = 抛异常 = 502
  if (cached) return JSON.parse(cached);
  const fresh = await db.product.findUnique({ where: { id } });
  return fresh;
}
```

### ✅ 最佳实践: Circuit Breaker + 降级到 DB

```typescript
// GOOD: Redis 故障 → 直接走 DB
import { CircuitBreaker } from 'opossum';

const redisBreaker = new CircuitBreaker(redis.get.bind(redis), {
  timeout: 100,             // 100ms 超时
  errorThresholdPercentage: 50,  // 50% 失败打开
  resetTimeout: 30000,      // 30s 后半开尝试
});

async function getProduct(id: string) {
  try {
    const cached = await redisBreaker.fire(`product:${id}`);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    // Redis 挂了 → 降级到 DB (降级期间可加 LRU 内存缓存)
    console.warn('Redis breaker open, fallback to DB', e.message);
  }

  // 降级路径: 直接查 DB
  const fresh = await db.product.findUnique({ where: { id } });
  return fresh;
}
```

**降级策略**:
- Redis 正常: 95% 命中率,DB QPS 5%
- Redis 故障: 0% 命中率,DB QPS 100% (但应用不挂)
- Redis 恢复: 自动恢复缓存

---

## 7. ❌ 反模式 7: 缓存无监控

```typescript
// BAD: 缓存命中率不知道
// 缓存击穿了?不知道
// 缓存多大?不知道
// key 数量?不知道
// 全部黑盒,出问题只能猜
```

### ✅ 最佳实践: 缓存指标埋点 + Grafana

```typescript
// GOOD: Prometheus 指标
import { Counter, Histogram, Gauge } from 'prom-client';

const cacheHitCounter = new Counter({
  name: 'cache_hit_total',
  labelNames: ['cache', 'key_pattern'],
  help: 'Cache hit count',
});

const cacheMissCounter = new Counter({
  name: 'cache_miss_total',
  labelNames: ['cache', 'key_pattern'],
});

const cacheLatency = new Histogram({
  name: 'cache_op_duration_seconds',
  labelNames: ['cache', 'op'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
});

async function getProduct(id: string) {
  const end = cacheLatency.startTimer({ cache: 'redis', op: 'get' });
  try {
    const cached = await redis.get(`product:${id}`);
    if (cached) {
      cacheHitCounter.inc({ cache: 'redis', key_pattern: 'product:*' });
      return JSON.parse(cached);
    }
    cacheMissCounter.inc({ cache: 'redis', key_pattern: 'product:*' });
  } finally {
    end();
  }

  // ... 加载 + 写回缓存
}

// Grafana 关键指标
// 1. 命中率 = cache_hit_total / (cache_hit_total + cache_miss_total)
//    目标 > 90%,告警 < 80%
// 2. P99 延迟 < 5ms
// 3. Redis 内存使用 < 80%
// 4. Redis 连接数 < 80%
```

---

## 8. ❌ 反模式 8: 多级缓存不一致

```
❌ BAD: L1 (内存) → L2 (Redis) → L3 (DB) 三级缓存
  → L1 更新了,L2 没更新 → 永久不一致
  → L2 失效了,L1 还活着 → 永久不一致
```

### ✅ 最佳实践: Read-Through + Pub/Sub 失效广播

```typescript
// GOOD: 三级缓存 + pub/sub 失效
class CacheService {
  private l1 = new Map<string, { value: any; expireAt: number }>();
  private subscribers = new Set<(key: string) => void>();

  constructor(private redis: RedisService, private db: DatabaseService) {
    // 订阅失效广播
    this.redis.subscribe('cache:invalidate', (key) => {
      this.l1.delete(key);
    });
  }

  async get<T>(key: string, loader: () => Promise<T>): Promise<T> {
    // L1: 内存缓存
    const l1Entry = this.l1.get(key);
    if (l1Entry && l1Entry.expireAt > Date.now()) return l1Entry.value;

    // L2: Redis
    const l2 = await this.redis.get(key);
    if (l2) {
      const value = JSON.parse(l2);
      this.l1.set(key, { value, expireAt: Date.now() + 60_000 });
      return value;
    }

    // L3: DB (loader)
    const fresh = await loader();

    // 写回 L2 + L1
    await this.redis.setex(key, randomTtl(300), JSON.stringify(fresh));
    this.l1.set(key, { value: fresh, expireAt: Date.now() + 60_000 });

    return fresh;
  }

  async invalidate(key: string) {
    // 失效: L1 (本机) + 广播 L1 (其他机器) + L2
    this.l1.delete(key);
    await this.redis.del(key);
    await this.redis.publish('cache:invalidate', key);
    // 所有订阅的实例 L1 一起失效
  }
}
```

---

## 9. 缓存粒度选择

| 粒度 | 适用 | 优 | 劣 |
|------|------|----|----|
| **对象级** (1 个对象 1 个 key) | 商品详情/用户资料 | 精准失效 | key 多 |
| **列表级** (1 页 1 个 key) | 商品列表/订单列表 | 复用高 | 粒度粗 |
| **聚合级** (统计结果) | 计数器/排行 | 性能极高 | 更新难 |
| **页面级** (整页 HTML) | 静态页 | 极致性能 | 个性化差 |

**神机营实践**:
- 商品详情: 对象级,TTL 1h,字段裁剪 (id/name/price/stock)
- 商品列表: 列表级,TTL 5min,分页缓存
- 销量统计: 聚合级,Redis INCR + 后台异步落 DB
- 首页: 页面级 CDN (Cloudflare/CloudFront)

---

## 10. 缓存淘汰策略

| 策略 | 描述 | 适用 |
|------|------|------|
| **LRU** | 最近最少使用 | 默认,大多数场景 |
| **LFU** | 最不经常使用 | 热点数据稳定 |
| **TTL** | 过期时间 | 时间敏感数据 |
| **FIFO** | 先进先出 | 顺序数据 |
| **Random** | 随机淘汰 | 简单场景 |

**Redis 默认**: `allkeys-lru` (所有 key 中淘汰 LRU)
**推荐**: `volatile-lru` (只淘汰带 TTL 的 key,保留永不过期)

```bash
# redis.conf
maxmemory 2gb
maxmemory-policy volatile-lru
```

---

## 11. Redis vs Memcached vs 内存

| 维度 | Redis | Memcached | 进程内存 (Map) |
|------|-------|-----------|----------------|
| 数据结构 | 丰富 (String/Hash/List/Set/ZSet/Stream) | 仅 KV | 仅 KV |
| 持久化 | 支持 (RDB/AOF) | 不支持 | 不支持 |
| 集群 | Redis Cluster (官方) | 一致性哈希 | 需自实现 |
| 性能 | ~100K QPS | ~200K QPS | ~1M QPS |
| 适用 | 通用首选 | 纯缓存简单场景 | 进程内 LRU |

**神机营选型**: **Redis Cluster** (3 master + 3 slave,分片)
- L1: 进程内存 Map (10K key,60s TTL)
- L2: Redis Cluster (100K+ key)
- L3: PostgreSQL (source of truth)

---

## 12. 缓存预热策略

```typescript
// GOOD: 服务启动时预热热点数据
async function warmUpCache() {
  const hotProducts = await db.product.findMany({
    where: { isHot: true, status: 'ACTIVE' },
    take: 1000,
  });

  console.log(`Warming up ${hotProducts.length} hot products...`);
  for (const product of hotProducts) {
    await redis.setex(
      `product:${product.id}`,
      randomTtl(3600),
      JSON.stringify(product),
    );
  }
  console.log('Cache warmup complete');
}

// main.ts
async function bootstrap() {
  await warmUpCache();
  await app.listen(3000);
}
```

**预热方式**:
- 启动期: 加载 Top 1000 热点
- 定时任务: 每 10 分钟刷新即将过期
- 数据变更: 主动失效/更新缓存

---

## 13. 神机营 SaaS v4.0 缓存架构

```
┌─────────────────────────────────────────────────────┐
│  Client (Browser/App)                                │
│  - L0: HTTP Cache (Cache-Control: max-age=300)      │
│  - L0: Service Worker Cache (IndexedDB)             │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  CDN (Cloudflare)                                    │
│  - L1: Edge Cache (HIT 命中率 95%)                   │
│  - 静态资源 30 天,API 0 秒 (proxy)                  │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  NestJS BFF (apps/api)                              │
│  - L2: 进程内存 LRU (10K key, 60s TTL)              │
│  - 用户 Session / 权限 / 路由配置                    │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  Redis Cluster (3 master + 3 slave)                 │
│  - L3: 业务缓存 (商品/订单/会员, TTL 5min-1h)       │
│  - L3: 分布式锁 (Redlock)                           │
│  - L3: Pub/Sub (cache invalidate broadcast)          │
│  - L3: Stream (事件总线)                             │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  PostgreSQL (Source of Truth)                        │
│  - 主库 + 2 副本 (流复制)                            │
│  - 只读副本承担 60% 读流量                            │
└─────────────────────────────────────────────────────┘
```

**命中率目标**:
- L0 CDN: 95% (静态资源)
- L2 进程: 30% (会话级)
- L3 Redis: 85% (业务级)
- DB: 实际 5% 流量穿透

---

## 14. 与其他反模式关联

| 反模式 | 关系 |
|--------|------|
| [performance-optimization.md](./performance-optimization.md) | 缓存 = 性能第一手段 |
| [db-index.md](./db-index.md) | 缓存未命中 → 索引救命 |
| [concurrency-safety.md](./concurrency-safety.md) | 分布式锁 = Redlock |
| [event-bus-design.md](./event-bus-design.md) | 缓存失效 = 事件广播 |
| [data-migration.md](./data-migration.md) | 缓存预热 = 数据迁移后必做 |
| [observability.md](./observability.md) | 命中率 = 关键 SLO |

---

## 15. 总结: 缓存策略银弹

> **核心**: Cache-Aside + 失效而非更新 + 多级 + 监控 + 降级

```
✅ TTL 随机化防雪崩
✅ 布隆过滤器防穿透
✅ 互斥锁防击穿
✅ 失效缓存 (非更新) 保一致
✅ 大 key 分片 + 压缩
✅ Circuit Breaker 防 Redis 故障
✅ Prometheus 命中率监控 (目标 >90%)
✅ L0 CDN + L1 内存 + L2 Redis + L3 DB 四级
✅ 启动期预热 + 定时刷新
```

**神机营 v4.0 实践**:
- Redis Cluster 3+3
- Cache-Aside 失效模式
- 命中率 SLA > 85%
- Prometheus + Grafana 全链路监控
- 故障自动降级到 DB

---

> 📅 创建: 2026-06-27 23:08 CST · 反模式库 v4 · Part 10 · caching-strategy
> 🦞🐜 龙虾哥 + 树哥trae 联合维护
