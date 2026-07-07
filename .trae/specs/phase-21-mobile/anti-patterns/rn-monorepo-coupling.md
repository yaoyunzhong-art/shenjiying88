# Anti-pattern · RN 与 Monorepo 强耦合

## ❌ 错误
```typescript
// apps/mobile 直接 import apps/api 的内部模块
import { LeadScoringService } from '../../api/src/modules/leads/lead-scoring.service';
import { calculateRiskScore } from '../../api/src/modules/risk/risk.util';

// RN bundle 把 NestJS @Injectable 全部打进移动包
// 编译失败:NestJS 依赖 Node.js fs/path
```

## 问题
- RN bundle 体积爆炸 (NestJS + dependencies ~ 几 MB)
- 编译错误:NestJS 用 Node.js fs/path,RN runtime 没有
- 部署耦合: 后端模块改动 → 移动端必须重打包
- 跨域依赖:web/api 共享代码必须 portable,RN 限制多

## ✅ 正确
```typescript
// apps/mobile 只通过 HTTP API 与后端通信
import { api } from '@network/api';

const leads = await api.get('/api/leads', { params: { topK: 10 } });

// 共享类型放 packages/shared
// packages/shared/src/types/lead.ts
export interface LeadScore { id: string; score: number; tier: 'hot' | 'warm' | 'cold'; }
```

## 教训
- T51 RN 初始化时,移动端只能 import `@network/api`、`@store/*`、`@screens/*`
- 共享类型必须放 `packages/shared`,不能 cross app import
- 任何 Node-only 依赖 (fs/child_process/crypto.createServer) 禁止进 RN bundle
