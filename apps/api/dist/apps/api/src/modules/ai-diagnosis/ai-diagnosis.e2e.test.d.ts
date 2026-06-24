/**
 * 🐜 自动: [ai-diagnosis] E2E 基础测试
 *
 * E2E 链路: HTTP → AiDiagnosisController → AiDiagnosisService → DiagnosisEntity/DiagnosisBatch
 *
 * 覆盖:
 *   - 完整诊断流程: 创建 → 查看 → 更新 → 删除
 *   - 批量诊断: 批量触发 → 查看批量 → 轮询进度 → 批量结果
 *   - 风险报告: 诊断完成 → 生成风险报告 → 风险标记
 *   - 诊断+规则引擎联动: 诊断发现风险 → 规则匹配 → 建议生成
 *   - 响应格式一致性
 *   - 错误处理与边界
 *   - 8 角色 HTTP 权限
 */
import 'reflect-metadata';
//# sourceMappingURL=ai-diagnosis.e2e.test.d.ts.map