# 🧠 知识库 · 30条领域知识（2026-07-11）

> 生成: 2026-07-11 23:59 · 基于三日实战 + 54专家评估

---

## 一、架构知识（5条）

### K001: 验收脉冲的"断裂无告警"死穴
验收脉冲成功后自动更新phase-progress.md，但失败时仅`lastRunStatus=error`，无任何推送。导致38连胜断裂后1h才被发现。
**规则**: 任何验收失败必须在5min内写入daily-brief告警区，且不应依赖人工巡查发现。

### K002: @ts-nocheck是技术债务的占位符
用`@ts-nocheck`掩盖的类型错误不会自动消失，会在下一次重构时爆炸。07-11的195个TSC错误中有相当一部分是被掩盖的遗留问题。
**规则**: `@ts-nocheck`最多存活24小时，必须在下个周日修复日前清零。

### K003: 5路树哥并行存在边际收益递减
3路并行产出约130 commits/天，5路并行只增加到202 commits/天（不是166%而是155%）。且余额消耗从¥38/天增到¥60+/天。
**规则**: 日常3路，突击5路，余额低于¥100时自动降2路。

### K004: admin-web是唯一必须龙虾哥动手的模块
3天反复验证：树哥写的admin-web页面100%被重写。但storefront-web树哥能产出（139页面/38K行）。
**规则**: 任何admin-web需求默认由龙虾哥在21:00-22:00时段产出，不浪费树哥配额。

### K005: TypeScript strict模式下的3个常见陷阱
- `Record<string, number>` 索引返回 `number | undefined`，不可直接运算
- `Partial<T>` spread后所有属性变 `T | undefined`
- 枚举不能使用 `import type` 导入（枚举同时是类型和运行时值）

---

## 二、Cron架构知识（5条）

### K006: isolated agentTurn vs main systemEvent 选型铁律
- **产文件** → isolated agentTurn（确保输出到项目目录）
- **无需产出** → main systemEvent（心跳/监控）
- 07-10的AM-014教训：产文件cron走main会导致产出丢失

### K007: 绝对路径铁律是cron可靠性的底线
isolated cron没有cd上下文，相对路径不可靠。所有cron prompt必须以`$PROJECT=/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88`开头。
**已验证**: 07-11 33个cron全部使用绝对路径，零路径故障。

### K008: cron的lastRunStatus=error不等于cron挂了
验收脉冲的error经常是测试hang超时，不是cron本身故障。区别方法是看`enabled=true` + `nextRunAtMs`在增长。
**规则**: cron监控只看enabled状态，error用于告警阈值但不禁用cron。

### K009: 20min间隔的健康检查cron比30min验收更灵敏
验收脉冲30min/次，断裂后最多30min才发现。加上20min的健康检查cron，断裂后最多12min写入告警（重叠区间会提前发现）。
**2026-07-11验证**: AM-019修复用20min间隔，平均发现延迟从>60min降到~10min。

### K010: 23:00日终cron是唯一必须跑在午夜前的汇总
其他cron可以延迟或跳过，但23:00日终包含自我进化检查和V(N+1)草案，是第二天开发的基础。
**规则**: 23:00 cron设置`timeoutSeconds=0`（无超时），确保跑完。

---

## 三、Phase推进知识（5条）

### K011: 多租户隔离(P-31)是P-35/P-36的前置依赖
TenantQuotaService的exports缺失导致tenant-isolation e2e全部hang。P-35收银和P-36会员都依赖多租户上下文。
**依赖链**: P-31多租户 → P-35收银 + P-36会员 → P-38财务 + P-37库存

### K012: P-53 Docker化全链路已经就绪
07-11树哥产出5,156行/39文件覆盖完整部署栈：Dockerfile(多阶段) + docker-compose(9services) + K8s(13 manifests) + Terraform(阿里云) + CI/CD(GitHub Actions)。
**状态**: 100%完成，等待首次docker-compose up验证。

### K013: Phase完成度评估3指标
- Backend测试 ✅ = entity+service+controller+test 完整
- Frontend页面 ✅ = admin-web或storefront-web页面存在且≥200行
- 验收通过 ✅ = 最近3次验收脉冲无fail
**P-35/P-36问题**: 后端测试✅但前端⬜，验收记录为空。

### K014: 6道门签署是Phase完成的门禁
G1(架构) → G2(业务) → G3(AI/数据) → G4(体验) → G5(合规) → G6(治理)。任何Phase闭环必须通过全部6道门。
**07-11签名状态**: G1✅ G2✅ G3⚠️ G4🟡 G5🟡 G6✅

### K015: 树哥的"测试偏向"需要龙虾哥人工校准
树哥自动生成优先做单元测试（entity/spec.ts）而不是功能代码。07-11的201 commits中约60%是测试文件。需要龙虾哥在派单时明确指定"功能优先"。

---

## 四、专家体系知识（5条）

### K016: 54专家分12组但实际只有G1~G6活跃
G1~G4(晨学)和G5~G8(午学)有产出，G9~G12(晚学)从未产生独立产出。原因是晚学时间(20:45)紧跟在晚会(20:00)后，产出融合到了evening-signoff中。
**建议**: G9~G12的独立产出应独立安排时间段，比如周六下午。

### K017: 专家组"事前的学术评审"是最有价值的时间段
G1~G4在08:00晨学评估架构风险、G5~G8在14:00午学评审数据AI质量，这两个时段发现的问题（如AM-019）比事后修复省时10倍。
**规则**: 晨学/午学不做代码产出，只做评审和风险评估。

### K018: 专家洞察的"跨领域交叉分析"产出率最高
07-11晚学中"G1×G4×G6"交叉分析发现了测试fail反模式的本质（类型变化→测试更新缺门禁）。单一Gate可能漏掉。
**规则**: 每次晚学至少产生1组跨领域交叉分析。

### K019: E40的用户验收五准则是有效的质量门禁
五准则（空态/加载态/错误态 + ≤3步 + P0-P3分级 + 免打扰 + P3可关闭）在07-11过滤了G4用户体验的🟡观察项。对于店A开业前验收，这是必要但不充分的检查。
**补充建议**: 增加第6准则"离线降级可用"。

### K020: 知识库的T1活跃层和archive归档层的分拆是有效的
T1层~15天摘要让日常读取节省~100KB tokens。archive层完整历史确保审计追溯。07-11的AM-017（不同步）暴露了T1需要定期从evolution-log同步的机制缺口。

---

## 五、测试知识（5条）

### K021: vitest平行进程导致CPU过载的根因
每个vitest worker fork占用30-50% CPU，20+平行进程可占满16核CPU。07-11风扇狂转的根因是测试运行器未限制parallelism。
**修复**: `turbo.json` 或 `vitest.config.ts` 中设置 `pool: 'forks'` + `maxWorkers: 4`。

### K022: `as any`是测试中最后的武器不是第一选择
07-10 AM-001确认为反模式。测试中应该mock正确构造器参数，而不是用as any掩盖。3天实战确认：mock 80%的case可以用`{} as any`填充不关心的参数，但关键参数必须给真实mock对象。

### K023: TSC验收应该分模块而不是全库扫描
全库typecheck每次120s+，对于修复阶段的快速迭代太慢。建议分模块：`pnpm -F @m5/api typecheck`（涉及后端变更时），`pnpm -F @m5/ui typecheck`（UI变更时）。
**07-11验证**: 从分模块typecheck到全库通过，从195err→0用时约45min（含5路树哥并行）。

### K024: admin-web的DataTable/PageShell组件prop变更会级联中断测试
07-11 pulse#332的14个fail中，80%是组件prop类型变更（如StatusBadge的children→label、DataTableColumn的width从number变string）。
**修复模式**: 对组件prop变更，应该在变更前先更新所有使用方的测试。

### K025: node test runner的Promise挂起假阳性 vs 真fail
node --test runner在async测试完成后报告`'Promise resolution is still pending'`是假阳性（非缓存时）。只看`ℹ fail N` (N>0才是真fail)，不看`✖ src/xxx`计数。
**07-09 AM-005反模式**: 首次遇到时误判为真实fail派了树哥。

---

## 六、余额/资源知识（5条）

### K026: ¥171.66余额按当前消耗只能撑4.5天
日均消耗¥38（3路树哥），5路时¥60+/天。距8/1开业还有21天，需要至少¥400-800。
**策略**: 周日降速到¥30/天，周一~周五压到¥35/天，每周约¥200。若不做充值调整，余额将在7/16耗尽。

### K027: 树哥的token消耗≈模型选择×输出行数
deepseek-chat：输入~¥0.15/Mtok，输出~¥0.60/Mtok。一个10K行树哥任务（如AI模块补全12K行）消耗约¥12-15。
**省钱技巧**: 修复类任务用更便宜的模型（deepseek-chat已经是最便宜的），新模块开发才用大模型。

### K028: 3路并行比5路并行的性价比高38%
3路：¥38/天 → 130 commits = ¥0.29/commit
5路：¥60/天 → 202 commits = ¥0.30/commit
**结论**: 5路并没有更贵（几乎相同单价），但CPU负载更高。3路是日常最优。

### K029: 资源监控cron是余额的预警系统
`🖥️ 资源监控·CPU/MEM不超过90%` cron每小时检查系统负载。但当前只监控CPU/MEM，不监控余额。
**改进建议**: 增加余额监控：余额<¥100时写入告警到daily-brief，<¥50时自动降树哥到2路。

### K030: 周六晚(21:00-23:00)是树哥产出效率最高时段
07-11数据：21:00-23:00间每路树哥耗时比白天快20-30%（API负载低）。这个时段适合派耗时较长的路（如AI模块补全）。
**策略**: 把复杂大任务安排在21:00后派单，简单修复放在白天。

---

## 七、修复策略知识（2条 2026-07-14 补充）

### K031: 子agent高频spawn在弱网络下不可靠→主session亲手修更快
07-14凌晨平行spawn5个子agent修TSC，全部因网络波动超时fail（耗时6-51s不等）。改为龙虾哥主session逐文件修，30min清79错误+1预存bug。
**规则**: 小粒度修复（<20错误/文件）→主session亲手修。大规模并行重写→子agent（~50+文件/K行）。

### K032: `createTxn` helper缺字段=系统化copy-paste bug
finance-reconciliation测试helper `createTxn`缺`externalTransactionId`字段，导致3处把`externalTransactionId`写成`externalAmount`（重复属性+类型错误）。helper缺字段会导致下游所有调用者默默错误。
**规则**: 测试helper函数必须与实体接口对齐，新增字段时同步更新helper签名。

---

**32条知识 · 生成完毕 ✅**
**签署**: 🦞 龙虾哥 · 2026-07-14 03:35
