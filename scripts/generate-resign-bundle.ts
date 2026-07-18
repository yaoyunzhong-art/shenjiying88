import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CURRENT_FILE = fileURLToPath(import.meta.url)
const CURRENT_DIR = path.dirname(CURRENT_FILE)
const ROOT = path.resolve(CURRENT_DIR, '..')
const OUTPUT_PATH = path.resolve(
  ROOT,
  'docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md',
)

type GateStatus = '🟢' | '🟡' | '🔴'

type GateItem = {
  id: string
  status: GateStatus
  summary: string
  blocking: string
  evidence: string[]
}

const materialFiles = [
  'DEVELOP-PLAN-v7.md',
  'docs/knowledge/expert-team/2026-07-19/develop-plan-v7-54-expert-review.md',
  'V7.2-RESIGN-CHECKLIST.md',
  'V7.2-7DAY-EXECUTION-SCHEDULE.md',
  'TASKS_STATUS.md',
  'WEEKLY-RYG-STATUS-BOARD.md',
  'EXTERNAL-BLOCKERS-OWNER-BOARD.md',
  'PRODUCTION-RELEASE-BUNDLE-POLICY.md',
  'docs/knowledge/acceptance/2026-07-19-b1-cashier-browser-acceptance.md',
  'docs/knowledge/acceptance/2026-07-19-c1-checkout-browser-acceptance.md',
  'docs/knowledge/acceptance/2026-07-19-c2-vrt-acceptance.md',
  'docs/knowledge/acceptance/2026-07-19-c3-p49-signoff.md',
  'docs/knowledge/acceptance/2026-07-19-g2-sensitive-config-remediation.md',
  'docs/knowledge/acceptance/2026-07-19-g4-writeback-pilot-acceptance.md',
  'docs/knowledge/acceptance/2026-07-19-g1-release-bundle-confirmation.md',
  'docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md',
]

const gates: GateItem[] = [
  {
    id: 'G1',
    status: '🟡',
    summary: '唯一生产交付口径、主计划与复签入口已统一',
    blocking: '待完成最终复签确认与外部资产落地',
    evidence: [
      'PRODUCTION-RELEASE-BUNDLE-POLICY.md',
      'PROD-INGRESS-CUTOVER-20260718.md',
      'PROD-BATCH-CHECKLIST-20260718.md',
      'docs/knowledge/acceptance/2026-07-19-g1-release-bundle-confirmation.md',
    ],
  },
  {
    id: 'G2',
    status: '🟢',
    summary: '外部阻塞责任化与敏感配置整改证据已齐',
    blocking: '无',
    evidence: [
      'EXTERNAL-BLOCKERS-OWNER-BOARD.md',
      'docs/knowledge/acceptance/2026-07-19-g2-sensitive-config-remediation.md',
    ],
  },
  {
    id: 'G3',
    status: '🟢',
    summary: 'B1 + C1 + C2 已全部闭环，满足 3/3',
    blocking: '无',
    evidence: [
      'docs/knowledge/acceptance/2026-07-19-b1-cashier-browser-acceptance.md',
      'docs/knowledge/acceptance/2026-07-19-c1-checkout-browser-acceptance.md',
      'docs/knowledge/acceptance/2026-07-19-c2-vrt-acceptance.md',
    ],
  },
  {
    id: 'G4',
    status: '🟢',
    summary: 'P-49 写实与自动回写试点均已完成',
    blocking: '无',
    evidence: [
      'docs/knowledge/acceptance/2026-07-19-c3-p49-signoff.md',
      'docs/knowledge/acceptance/2026-07-19-g4-writeback-pilot-acceptance.md',
      'docs/knowledge/acceptance/2026-07-19-g4-writeback-pilot-generated.md',
    ],
  },
  {
    id: 'G5',
    status: '🟢',
    summary: 'POS/Pad 与税务/发票任务卡均已落地',
    blocking: '无',
    evidence: [
      'docs/knowledge/requirement-cards/2026-07-19-PLAN-REV-B1-pos-pad.md',
      'docs/knowledge/requirement-cards/2026-07-19-PLAN-REV-B2-tax-invoice.md',
    ],
  },
  {
    id: 'G6',
    status: '🟡',
    summary: '联动验收链目标已明确',
    blocking: '待补活动/营销/会员/门店联动验收链',
    evidence: ['V7.2-RESIGN-CHECKLIST.md', 'TASKS_STATUS.md'],
  },
  {
    id: 'G7',
    status: '🟡',
    summary: 'miniapp 聚焦方向已写入排期',
    blocking: '待补供应链/会员高频链证据',
    evidence: ['TASKS_STATUS.md', 'V7.2-7DAY-EXECUTION-SCHEDULE.md'],
  },
  {
    id: 'G8',
    status: '🟡',
    summary: '离线 render / preflight / dry-run / verify 证据已补齐',
    blocking: '待补 server dry-run 与正式窗口日志',
    evidence: [
      'EXTERNAL-BLOCKERS-OWNER-BOARD.md',
      'docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md',
      'V7.2-RESIGN-CHECKLIST.md',
    ],
  },
  {
    id: 'G9',
    status: '🟢',
    summary: '红黄绿状态板与任务状态页均已建立',
    blocking: '无',
    evidence: ['WEEKLY-RYG-STATUS-BOARD.md', 'TASKS_STATUS.md'],
  },
]

function ensureFile(relativePath: string) {
  const absolutePath = path.resolve(ROOT, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing file: ${relativePath}`)
  }
}

function link(relativePath: string) {
  return `[${path.basename(relativePath)}](file://${path.resolve(ROOT, relativePath)})`
}

function renderGateRow(gate: GateItem) {
  return `| ${gate.id} | ${gate.status} | ${gate.summary} | ${gate.blocking} | ${gate.evidence
    .map(link)
    .join(' / ')} |`
}

function main() {
  for (const file of materialFiles) {
    ensureFile(file)
  }
  for (const gate of gates) {
    for (const file of gate.evidence) {
      ensureFile(file)
    }
  }

  const greenCount = gates.filter((gate) => gate.status === '🟢').length
  const yellowCount = gates.filter((gate) => gate.status === '🟡').length
  const redCount = gates.filter((gate) => gate.status === '🔴').length

  const markdown = `# 2026-07-19 · V7.2 复签总包

> 生成方式: \`pnpm resign:bundle\`
> 生成时间: ${new Date().toISOString()}
> 目标: 将 \`G1~G9\` Gate 状态、证据入口、阻塞项与复签输入材料收口为单一交付包

## 总体结论

- 当前结论: \`🟡 可准备复签，暂不建议正式发起\`
- Gate 分布: \`🟢 ${greenCount}\` / \`🟡 ${yellowCount}\` / \`🔴 ${redCount}\`
- 当前最大阻塞: \`G1\`
- 剩余收尾项: \`G6 / G7 / G8\`

## Gate 总览

| Gate | 状态 | 当前事实 | 阻塞 | 核心证据 |
|------|:----:|----------|------|----------|
${gates.map(renderGateRow).join('\n')}

## 复签输入材料

1. ${link('DEVELOP-PLAN-v7.md')}
2. ${link('docs/knowledge/expert-team/2026-07-19/develop-plan-v7-54-expert-review.md')}
3. ${link('V7.2-RESIGN-CHECKLIST.md')}
4. ${link('V7.2-7DAY-EXECUTION-SCHEDULE.md')}
5. ${link('TASKS_STATUS.md')}
6. ${link('WEEKLY-RYG-STATUS-BOARD.md')}
7. ${link('EXTERNAL-BLOCKERS-OWNER-BOARD.md')}
8. ${link('PRODUCTION-RELEASE-BUNDLE-POLICY.md')}
9. ${link('docs/knowledge/acceptance/2026-07-19-b1-cashier-browser-acceptance.md')}
10. ${link('docs/knowledge/acceptance/2026-07-19-c1-checkout-browser-acceptance.md')}
11. ${link('docs/knowledge/acceptance/2026-07-19-c2-vrt-acceptance.md')}
12. ${link('docs/knowledge/acceptance/2026-07-19-c3-p49-signoff.md')}
13. ${link('docs/knowledge/acceptance/2026-07-19-g2-sensitive-config-remediation.md')}
14. ${link('docs/knowledge/acceptance/2026-07-19-g4-writeback-pilot-acceptance.md')}
15. ${link('docs/knowledge/acceptance/2026-07-19-g1-release-bundle-confirmation.md')}
16. ${link('docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md')}

## 发起复签前仍需补齐

1. \`G1\`: 完成唯一交付口径的最终复签确认，并跟进外部资产落地结果
2. \`G6\`: 产出活动/营销/会员/门店联动验收链
3. \`G7\`: 产出 miniapp 供应链/会员高频链证据
4. \`G8\`: 产出 dry-run / apply / rollback 运行证据

## 建议顺序

1. 先以本文件作为复签总包单入口
2. 再围绕 \`G1 / G6 / G7 / G8\` 补最后一圈证据
3. 最后更新 \`V7.2-RESIGN-CHECKLIST.md\` 第 4 节的总体复签结论
`

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, markdown)
  console.log(`✅ resign bundle generated: ${OUTPUT_PATH}`)
}

main()
