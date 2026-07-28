const fs = require('fs')
const path = require('path')

const base = path.join(process.cwd(), 'apps/admin-web/app/stores/[id]')
const entries = fs.readdirSync(base, { withFileTypes: true }).filter((entry) => entry.isDirectory())

for (const entry of entries) {
  const dir = path.join(base, entry.name)
  const pagePath = path.join(dir, 'page.tsx')
  if (!fs.existsSync(pagePath)) continue

  const src = fs.readFileSync(pagePath, 'utf8')
  const clientMatch = src.match(/import\s+(\w+)\s+from\s+'(\.\/[^']+-client)'/)
  const loaderMatch = src.match(/import\s+\{\s*(load\w+Snapshot)\s*\}\s+from\s+'(\.\/[^']+-data)'/)
  const fnMatch = src.match(/export default async function\s+(\w+)\s*\(/)

  if (!clientMatch || !loaderMatch || !fnMatch) continue

  const clientName = clientMatch[1]
  const clientImport = clientMatch[2]
  const loadName = loaderMatch[1]
  const dataImport = loaderMatch[2]
  const fnName = fnMatch[1]
  const hasSearchParams = src.includes('searchParams')
  const resolveMatch = src.match(
    /function resolveTenantId\(value: string \| string\[\] \| undefined\): string \{[\s\S]*?\n\}/,
  )
  const snapshotLineMatch = src.match(/const snapshot = await .*?\n/)

  if (!snapshotLineMatch) continue

  let pageContent = `import ${clientName} from '${clientImport}'\nimport { ${loadName} } from '${dataImport}'\n\nexport const dynamic = 'force-dynamic'\nexport const revalidate = 0\n\n`

  if (hasSearchParams) {
    pageContent += `type PageProps = {\n  params: Promise<{ id: string }>\n  searchParams: Promise<Record<string, string | string[] | undefined>>\n}\n\n`
    if (resolveMatch) {
      pageContent += `${resolveMatch[0]}\n\n`
    }
    pageContent += `export default async function ${fnName}({ params, searchParams }: PageProps) {\n  const [{ id }, query] = await Promise.all([params, searchParams])\n  ${snapshotLineMatch[0].trim().replace(/;$/, '')}\n\n  return <${clientName} snapshot={snapshot} />\n}\n`
  } else {
    pageContent += `type PageProps = {\n  params: Promise<{ id: string }>\n}\n\n`
    pageContent += `export default async function ${fnName}({ params }: PageProps) {\n  const { id } = await params\n  const snapshot = await ${loadName}(id)\n\n  return <${clientName} snapshot={snapshot} />\n}\n`
  }

  fs.writeFileSync(pagePath, pageContent)

  const testFiles = ['page.test.tsx', 'page.test.ts']
    .map((name) => path.join(dir, name))
    .filter((testPath) => fs.existsSync(testPath))

  for (const testPath of testFiles) {
    const rel = `stores/[id]/${entry.name}/page.tsx`
    const testContent = `import assert from 'node:assert/strict'\nimport { describe, it } from 'node:test'\nimport { readFileSync } from 'node:fs'\nimport { dirname, resolve } from 'node:path'\nimport { fileURLToPath } from 'node:url'\n\nconst DIR = dirname(fileURLToPath(import.meta.url))\nconst PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')\n\ndescribe('${rel} 结构固证', () => {\n  it('page 应保持最小 server wrapper 并桥接快照到 client', () => {\n    assert.ok(!PAGE_SRC.includes(\"'use client'\"))\n    assert.ok(PAGE_SRC.includes('export default async function ${fnName}'))\n    assert.ok(PAGE_SRC.includes('const snapshot = await ${loadName}'))\n    assert.ok(PAGE_SRC.includes('<${clientName} snapshot={snapshot} />'))\n    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))\n    assert.ok(!PAGE_SRC.includes('sourceEvidence'))\n  })\n\n  it('page 应保留服务端参数解包', () => {\n    ${
      hasSearchParams
        ? "assert.ok(PAGE_SRC.includes('searchParams: Promise<Record<string, string | string[] | undefined>>'))"
        : "assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))"
    }\n    ${
      hasSearchParams
        ? "assert.ok(PAGE_SRC.includes('Promise.all([params, searchParams])'))"
        : "assert.ok(PAGE_SRC.includes('const { id } = await params'))"
    }\n    ${
      hasSearchParams
        ? "assert.ok(PAGE_SRC.includes('resolveTenantId'))"
        : "assert.ok(!PAGE_SRC.includes('searchParams'))"
    }\n  })\n})\n`
    fs.writeFileSync(testPath, testContent)
  }
}
