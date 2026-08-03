import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CURRENT_FILE = fileURLToPath(import.meta.url)
const CURRENT_DIR = path.dirname(CURRENT_FILE)
const ROOT = path.resolve(CURRENT_DIR, '..')
const OUTPUT_PATH = path.resolve(
  ROOT,
  'docs/knowledge/acceptance/2026-07-19-g4-writeback-pilot-generated.md',
)

type PilotPhase = {
  phaseId: string
  phaseName: string
  prd: string
  requirementCard: string
  auditDoc: string
  runbookDoc: string
  evidence: string[]
}

const pilotPhases: PilotPhase[] = [
  {
    phaseId: 'P-49',
    phaseName: '开放平台',
    prd: 'docs/knowledge/prd/prd-open-platform-p49.md',
    requirementCard: 'docs/knowledge/requirement-cards/2026-07-13-P49-open-platform.md',
    auditDoc: 'docs/knowledge/p49-open-platform-team-audit.md',
    runbookDoc: 'docs/knowledge/runbook-audit.md',
    evidence: [
      'docs/knowledge/acceptance/2026-07-19-c3-p49-signoff.md',
      'apps/api/src/modules/openapi/open-platform-ringbeam.test.ts',
      'apps/api/src/modules/open-api/open-api-ringbeam.test.ts',
      'apps/api/src/modules/tenant-llm/tenant-llm-ringbeam.test.ts',
    ],
  },
  {
    phaseId: 'P-53',
    phaseName: '部署 DevOps',
    prd: 'docs/knowledge/prd/prd-devops-p53.md',
    requirementCard: 'docs/knowledge/requirement-cards/2026-07-14-P53-devops.md',
    auditDoc: 'docs/knowledge/p53-devops-team-audit.md',
    runbookDoc: 'docs/knowledge/runbook-audit.md',
    evidence: [
      'PRODUCTION-RELEASE-BUNDLE-POLICY.md',
      'COMPOSE-DEPLOY-RUNBOOK.md',
      'scripts/preflight-k8s-release.sh',
      'scripts/prepare-prod-cutover-bundle.sh',
    ],
  },
]

function assertFileExists(relativePath: string) {
  const absolutePath = path.resolve(ROOT, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing file: ${relativePath}`)
  }
}

function toFileLink(relativePath: string) {
  return `[${path.basename(relativePath)}](file://${path.resolve(ROOT, relativePath)})`
}

function buildRow(phase: PilotPhase) {
  return `| ${phase.phaseId} | ${phase.phaseName} | ${toFileLink(phase.prd)} | ${toFileLink(phase.requirementCard)} | ${toFileLink(phase.auditDoc)} | ${toFileLink(phase.runbookDoc)} | ${phase.evidence.map(toFileLink).join(' / ')} |`
}

function main() {
  for (const phase of pilotPhases) {
    assertFileExists(phase.prd)
    assertFileExists(phase.requirementCard)
    assertFileExists(phase.auditDoc)
    assertFileExists(phase.runbookDoc)
    for (const file of phase.evidence) {
      assertFileExists(file)
    }
  }

  const markdown = `# 2026-07-19 · G4 自动回写试点生成结果

> 生成方式: \`pnpm writeback:pilot\`
> 生成时间: ${new Date().toISOString()}
> 目标: 将 \`Phase / PRD / Requirement Card / Audit / Runbook / Evidence\` 收口为单一回写视图

## 试点范围

| Phase | 名称 | PRD | 需求卡 | 审计 | Runbook | 证据 |
|------|------|-----|--------|------|---------|------|
${pilotPhases.map(buildRow).join('\n')}

## 当前结论

- 试点已覆盖 \`P-49\` 与 \`P-53\`
- 所有输入源文件均存在，生成链已打通
- 当前输出适合作为 \`G4\` 自动回写试点的最小可运行版本

## 下一步

1. 将生成结果接入 nightly 或 release gate
2. 扩展到 \`P-35 / P-38 / P-31\`
3. 在生成结果中追加测试执行摘要与更新时间戳
`

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, markdown)
  console.log(`✅ writeback pilot generated: ${OUTPUT_PATH}`)
}

main()
