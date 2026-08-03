-- 导入反/正向模式库 (patterns-anti-patterns.md)
-- ADR-045 · 2026-07-19 11:57

-- 反模式 (AM-001 ~ AM-045)
INSERT INTO empower_card (tag, summary, source, module_mapping, freshness_score, confidence)
VALUES
('技术', 'AM-001: as any 掩盖类型错误', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-002: isolated cron + 超长 prompt', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-003: 验收脉冲只记录不修复', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-004: 侦察兵假完成·数据不完整', 'patterns-anti-patterns.md', '竞品分析', 85, 95),
('技术', 'AM-005: 非缓存turbo test假阳性·Promise挂起误报', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-006: 强制分配制(取代建议列表)', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-007: systemEvent注入主session(取代isolated)', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-008: @m5/api增量校验+每周止血专线', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-009: cache mask 导致假绿(force-run才暴露)', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-010: vitest平行进程占满CPU', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'AM-011: 会议cron空跑(2ms)不产出', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-012: admin-web树哥100%丢失', 'patterns-anti-patterns.md', 'admin-web', 80, 90),
('技术', 'AM-013: 测试过剩·功能开发比例失衡', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-014: systemEvent模式会议产出丢失', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-015: force-run后不检查产出', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-016: isolated cron写workspace而非项目目录', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-017: T1索引与evolution-log不同步', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-018: expert-insights/目录持续为空', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-019: 验收断裂无告警机制', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-020: 缓存假阳长期掩盖真实状态', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-021: RQ长时间未闭合无自动升级机制', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-022: P0派遣前缺少根因事实确认', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-023: 周日树哥零响应', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-024: 午会执行队列零验收', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-025: 合盖空转无保护', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-026: 午会Gate缺失→下午窗口失控', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-027: 周日/周一恢复效率低下', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-028: 59路由树哥0/5正确 → P0紧急修复', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-029: 子模块增加未同步app.module', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-030: 子agent多次exec提交→commit消息被吞噬', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-031: 二次push → 远程覆盖', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-032: 树哥交付后多处代码未通过TSC', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-033: 测试假阴性吞没(内存泄漏)', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-034: 测试跳过验证基线状态', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-035: 截止日依赖树哥一次性交付(90%不达标)', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-036: 暂停P-35/36做P0 → 新P0相继爆发', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-037: 树哥不稳定 → 增加树哥(反效果)', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-038: 树哥超时10min → 触发回滚', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-039: 验收直接PASS未检查数量/质量', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-040: 派单只有模块名没关键字', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-041: P0合入主干前50+alerts → 团队崩溃', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-042: 晨会8:30→9:30仍不够 → 加专题', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'AM-043: 午会G4体验抽查 → 测试仅6行占位符', 'patterns-anti-patterns.md', '全模块', 80, 90),
('技术', 'AM-044: V18人脑评审空转 → 使用代码评审', 'patterns-anti-patterns.md', '全模块', 85, 95),
('技术', 'AM-045: V19午会晨会效率下降67%', 'patterns-anti-patterns.md', '全模块', 80, 85)
ON CONFLICT DO NOTHING;

-- 正向模式 (PP-001 ~ PP-033)
INSERT INTO empower_card (tag, summary, source, module_mapping, freshness_score, confidence)
VALUES
('技术', 'PP-001: 三路并行修 fail — 5min 修 6 bug', 'patterns-anti-patterns.md', '全模块', 90, 95),
('技术', 'PP-002: 小粒度 commit — 零回退', 'patterns-anti-patterns.md', '全模块', 90, 95),
('技术', 'PP-003: 30min 验收覆盖 — 全量透视', 'patterns-anti-patterns.md', '全模块', 90, 95),
('技术', 'PP-004: 交叉验证 — 发现53场馆仅80行假数据', 'patterns-anti-patterns.md', '竞品分析', 90, 95),
('技术', 'PP-005: force跑验证非缓存假阳性', 'patterns-anti-patterns.md', '全模块', 90, 95),
('技术', 'PP-006: 2步修复法(还原→修复) 3min 6 bug', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-007: 子agent时序提交 + tag标记', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-008: 全量圈梁(五面: PRD+代码+测试+审计+合规)', 'patterns-anti-patterns.md', '全模块', 90, 95),
('技术', 'PP-009: git --onto + 强排安全修正', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-010: 测试补盲(全流程+专家+增量+验收)', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-011: 增量+止血双线反模式(A类当天修)', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-012: 副session(树哥)正确率监督+重派', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-013: 精确到每个test描述的反模式', 'patterns-anti-patterns.md', '全模块', 85, 85),
('技术', 'PP-014: 14人队长+强制CC认证+加速', 'patterns-anti-patterns.md', '全模块', 80, 85),
('技术', 'PP-015: 早+午+晚三会验证P0修复', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-016: 数据层→业务层→控制层(分层覆盖)', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-017: PRD+圈梁对齐流水线 — 101模块3h归类', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-018: 龙虾哥admin-web批量写模式 — 17页单日完成', 'patterns-anti-patterns.md', 'admin-web', 85, 95),
('技术', 'PP-019: 7-Gate晚宴签署流程', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-020: 主session逐文件修vs子agent并行 — TSC 30min清79错误', 'patterns-anti-patterns.md', '全模块', 90, 95),
('技术', 'PP-021: 预存copy-paste bug检查', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-022: 页面拉升批量执行模式', 'patterns-anti-patterns.md', 'storefront', 85, 90),
('技术', 'PP-023: 圈梁118模块全量审计填充', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-024: 午会精准派单+双Deadline', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-025: AM-019快速诊断+修复模式', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-026: E40用户验收自动化', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-027: TSC清零战30min模式', 'patterns-anti-patterns.md', '全模块', 90, 95),
('技术', 'PP-028: 54人专家全量整合', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-029: P-35/P-36截止日交付成功', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-030: storefront 218✖断裂自愈', 'patterns-anti-patterns.md', 'storefront', 85, 90),
('技术', 'PP-031: 验收脉冲13🏆稳态🏆', 'patterns-anti-patterns.md', '全模块', 85, 90),
('技术', 'PP-032: subagent prompt "跳过通读直接写"', 'patterns-anti-patterns.md', '全模块', 90, 95),
('技术', 'PP-033: 多数据源聚合→知识库实时同步', 'patterns-anti-patterns.md', '全模块', 85, 90)
ON CONFLICT DO NOTHING;

SELECT '🏆 反/正模式导入完成' as status;
SELECT COUNT(*) || ' 条反模式' as am FROM empower_card WHERE summary LIKE 'AM-%';
SELECT COUNT(*) || ' 条正向模式' as pp FROM empower_card WHERE summary LIKE 'PP-%';
SELECT COUNT(*) || ' 条总计' as total FROM empower_card;
