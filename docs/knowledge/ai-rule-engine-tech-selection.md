# AI V11-2 规则引擎技术选型报告

> 日期: 2026-07-20 | 状态: ✅ Finalized | G3签署: 待签署

---

## 1. 背景

shenjiying88 POS/收银/优惠/Promotions 体系需要灵活可配的业务规则引擎，用于：

- 优惠券发放条件（消费金额≥X、用户等级≥Y、门店≠Z）
- 阶梯定价规则（满减、折扣、买赠）
- 促销排期条件（时间段、星期、节假日）
- 权限规则（功能可见性、操作限制）
- 推荐/定价实时计算

当前状态：优惠规则硬编码在业务逻辑中，每次修改需发版。目标通过规则引擎实现 **业务规则可配置化**。

---

## 2. 候选方案横向对比

| 维度 | json-rules-engine v7.3.1 | node-rules v9.2.0 | nools v0.4.4 | 自研LightRule |
|:-----|:------------------------:|:-----------------:|:------------:|:-------------:|
| **类型** | JSON声明式 | Rete前向推理 | Drools风格DSL | 自定义轻量 |
| **npm周下载量** | ~150K | ~5K | ~1K | - |
| **最新更新** | 2025+活跃 | 2024+活跃 | 2019停滞 | - |
| **TypeScript支持** | ✅ 原生 | ❌ 需类型声明 | ❌ 无 | ✅ 自建 |
| **JSON可序列化** | ✅ 核心特性 | ⚠️ 部分 | ❌ DSL语法 | ✅ |
| **动态更新** | ✅ 规则热加载 | ❌ 需重启 | ❌ 需重启 | ✅ |
| **分布式就绪** | ✅ 纯数据驱动 | ❌ 内存状态 | ❌ 内存状态 | ✅ |
| **性能（千规则/秒）** | ~50K | ~10K | ~1K | L0≈100K |
| **复杂度上限** | 中等 | 中等 | 高（接近Drools） | 低 |
| **学习成本** | 低（JSON格式） | 中 | 高（DSL） | 低（自建） |
| **社区活跃度** | 🟢 高 | 🟡 中 | 🔴 停滞 | - |
| **NestJS集成** | ✅ 自定义Provider | ✅ Provider封装 | ⚠️ 困难 | ✅ Native |
| **Bundle size** | ~30KB | ~50KB | ~200KB | ~10KB |

---

## 3. 深度分析

### 3.1 json-rules-engine (推荐 🥇)

**优势：**
- JSON格式规则，天然可序列化→可存DB→支持管理后台CRUD
- 完美支持"条件+事件"模式：`{ conditions: { all: [...] }, event: { type: 'applyDiscount' } }`
- 支持 `all`/`any`/`not` 条件组合，可表达复杂业务
- 支持 `fact` 和自定义 `operator`，可适配现有 domain 模型
- 规则运行不依赖 Node.js 运行时状态，适合微服务/Serverless
- 成熟度高（7年+），在多家FinTech使用

**劣势：**
- 不内置Rete网络（vs node-rules有Rete），单次规则匹配全量扫描
- 不支持推理链（forward chaining需要手动编排）
- 无内置优先级调度（需自定义排序）

**适用场景：** ✅ 优惠规则、促销排期、权限检查、配置驱动计算

### 3.2 node-rules

**优势：**
- 基于 Rete 算法，重复匹配场景性能更优
- 支持 forward chaining 推理
- API简洁：`{ rule: (fact) => ..., consequence: (fact) => {} }`

**劣势：**
- 规则非纯JSON，内含JS函数，无法序列化
- 更新规则需代码变更（非配置化）
- 不适合作为配置化平台的基础
- 周下载量低，社区较小

**适用场景：** ⚠️ 实时推理规则，但本项目不适合

### 3.3 nools

**优势：**
- 最接近 Drools（Java标准规则引擎）
- 支持规则流（ruleflow）、议程分组、优先级
- DSL 表达能力最强

**劣势：**
- 2019年停更，npm最新版0.4.4
- DSL 语法学习成本高、审核困难
- TypeScript 零支持
- 不适合需要管理后台配置化的场景

**适用场景：** ❌ 已停滞，不推荐

### 3.4 自研 LightRule（可考虑，但暂不主推）

**优势：**
- 完全按需定制，与现有 entity/model 深度对齐
- 极致轻量（~10KB）
- TypeScript 原生
- 0依赖

**劣势：**
- 需要从零开发规则引擎基础设施（解析器/求值器/调度器）
- 没有社区验证
- 短期开发成本高（估测3-5天）

**建议：** 先使用 json-rules-engine 快速落地，后续如有特殊需求再自研扩展层。

---

## 4. 推荐方案: json-rules-engine 🥇

### 4.1 选择理由

1. **JSON格式 = 可配置化** — 规则可以存DB、管理后台CRUD、版本化、审计
2. **学习成本极低** — 运营人员可通过JSON模板创建规则
3. **NestJS友好** — 封装为 `RulesEngineService` Provider 即可
4. **成熟可靠** — 7.3.1版本，周下载150K，FinTech已验证
5. **无状态设计** — 适合微服务/多实例部署
6. **与现有系统对齐** — `fact` 模型可直接映射为现有 entity/dto

### 4.2 集成架构

```
[管理后台 JSON规则CRUD] ──→ PostgreSQL规则表 ──→ RulesEngineService
                                                      │
[请求上下文(fact)] ──────────────────────────────→ [规则求值] ──→ [事件动作]
                                                      │
                                                 Redis缓存(可选)
```

### 4.3 规则模型设计

```typescript
// 规则模板 (存DB)
interface RuleTemplate {
  id: string;
  name: string;              // 规则名称，如"满100减20"
  module: 'promotion' | 'discount' | 'permission' | 'recommend';
  priority: number;          // 优先级 (数字越小越优先)
  conditions: RuleConditions;
  event: RuleEvent;
  active: boolean;
  startAt?: Date;
  endAt?: Date;
}

// 条件示例 (json-rules-engine格式)
const conditions = {
  all: [
    { fact: 'orderTotal', operator: 'greaterThanInclusive', value: 100 },
    { fact: 'userLevel', operator: 'greaterThanInclusive', value: 2 },
    { fact: 'storeId', operator: 'notEqual', value: 'BLACKLIST_STORE' },
  ]
};

// 事件示例
const event = {
  type: 'applyDiscount',
  params: { type: 'fixed', value: 20, label: '满100减20' }
};
```

### 4.4 NestJS集成代码示例

```typescript
// rules-engine.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([RuleEntity])],
  providers: [RulesEngineService],
  exports: [RulesEngineService],
})
export class RulesEngineModule {}

// rules-engine.service.ts
@Injectable()
export class RulesEngineService {
  private engine: Engine;

  constructor(@InjectRepository(RuleEntity) private ruleRepo: Repository<RuleEntity>) {
    this.engine = new Engine();
  }

  async evaluate(fact: Record<string, any>, module: string): Promise<RuleEvent[]> {
    const rules = await this.ruleRepo.find({
      where: { module, active: true },
      order: { priority: 'ASC' },
    });
    
    rules.forEach(r => this.engine.addRule(this.toJsonRule(r)));
    
    const events: RuleEvent[] = [];
    this.engine.on('success', (event) => events.push(event));
    await this.engine.run(fact);
    
    return events;
  }

  private toJsonRule(rule: RuleEntity): any {
    return {
      conditions: rule.conditions,
      event: rule.event,
      priority: rule.priority,
    };
  }
}
```

---

## 5. 落地计划

| 阶段 | 内容 | 估时 |
|:----:|:-----|:----:|
| P0 | `json-rules-engine` 安装 + `RulesEngineModule` Provider | 1h |
| P1 | 规则表 Entity + Repository + CRUD API | 2h |
| P2 | Promotions模块对接规则引擎（替换硬编码） | 3h |
| P3 | Discount模块对接 | 2h |
| P4 | 管理后台规则管理页面（规则列表/Create/Edit/Test） | 4h |
| P5 | 规则版本化 + 审计日志 | 2h |
| P6 | Redis缓存 + 性能调优 | 1h |

**总计**: ~15h（纯前端~4h在P4/P5）

---

## 6. 风险管理

| 风险 | 概率 | 影响 | 缓解措施 |
|:-----|:----:|:----:|:---------|
| json-rules-engine不满足复杂嵌套逻辑 | 低 | 中 | 自定义operator扩展 |
| 规则爆炸导致性能下降 | 低 | 低 | Redis缓存+规则分片 |
| 运营人员JSON语法错误 | 中 | 中 | 规则验证端点+前端schema校验 |
| 需要Distributed inference | 低 | 高 | 规则保持无状态+全量求值 |

---

## 7. 决策

**选择: json-rules-engine v7.3.1** ✅

下一动作：由 P-47 或下一轮树哥安装依赖并创建 `RulesEngineModule`。
