/**
 * chaos.service.ts — Chaos Service (canonical name)
 *
 * 🐜 V17: 模块补齐 — 规范文件名
 *
 * 委托至 chaos-engineering.service.ts。
 */

export {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'
