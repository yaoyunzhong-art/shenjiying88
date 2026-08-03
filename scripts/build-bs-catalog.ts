import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CURRENT_FILE = fileURLToPath(import.meta.url)
const CURRENT_DIR = path.dirname(CURRENT_FILE)
const ROOT = path.resolve(CURRENT_DIR, '..')

const SOURCE_PATH = path.resolve(
  ROOT,
  'docs/operations/r18-requirement-dev-mapping.md',
)

const OUTPUT_DIR = path.resolve(ROOT, '.trae/compliance')
const OUTPUT_PATH = path.resolve(OUTPUT_DIR, 'bs-catalog.json')
const COVERAGE_MATRIX_PATH = path.resolve(OUTPUT_DIR, 'coverage-matrix.json')

type BsCatalogItem = {
  id: string
  section: string | null
  chapter: string | null
  title: string | null
  priority: string | null
  fields: Record<string, string>
  extra: string[] | null
}

const parseRowCells = (line: string) => {
  const parts = line.split('|').map((x) => x.trim())
  if (parts.length < 3) return []
  return parts.slice(1, parts.length - 1)
}

const parseCatalogItems = (source: string): BsCatalogItem[] => {
  const lines = source.split(/\r?\n/)
  const sectionTwoIndex = lines.findIndex((x) => x.trim().startsWith('## 二、'))
  const scopeLines = (sectionTwoIndex > 0 ? lines.slice(0, sectionTwoIndex) : lines).map((x) =>
    x.trim(),
  )

  const itemsById = new Map<string, BsCatalogItem>()
  let currentHeaders: string[] | null = null
  let currentSection: string | null = null

  const score = (item: BsCatalogItem) => {
    const fieldCount = Object.keys(item.fields).length
    const core = [item.chapter, item.title, item.priority].filter(
      (x) => x !== null && x !== '',
    ).length
    return fieldCount * 10 + core
  }

  const guessTitle = (fields: Record<string, string>) =>
    fields['条款'] ??
    fields['优化项'] ??
    fields['需求简述'] ??
    fields['名称'] ??
    null

  const guessChapter = (fields: Record<string, string>) => {
    const v = fields['章节'] ?? fields['来源[章节]'] ?? null
    if (!v) return null
    if (/^\d+(\.\d+)?$/.test(v)) return v
    return null
  }

  for (const line of scopeLines) {
    if (line.startsWith('### ')) {
      currentSection = line.replace(/^###\s+/, '').trim()
      currentHeaders = null
      continue
    }

    if (!line.startsWith('|')) continue

    const cells = parseRowCells(line)
    if (cells.length === 0) continue

    if (cells[0] === 'BS编号') {
      currentHeaders = cells
      continue
    }

    if (!currentHeaders) continue

    const id = cells[0]
    if (!id || !/^BS-\d{4}$/.test(id)) continue

    const fields: Record<string, string> = {}
    for (let i = 1; i < Math.min(cells.length, currentHeaders.length); i += 1) {
      const key = currentHeaders[i]
      const value = cells[i] ?? ''
      if (key && key !== 'BS编号') fields[key] = value
    }

    const extra =
      cells.length > currentHeaders.length ? cells.slice(currentHeaders.length) : null

    const title = guessTitle(fields)
    const chapter = guessChapter(fields)
    const priority = fields['优先级'] ?? null

    const current: BsCatalogItem = {
      id,
      section: currentSection,
      chapter,
      title,
      priority,
      fields,
      extra,
    }

    const prev = itemsById.get(id)
    if (!prev || score(current) > score(prev)) {
      itemsById.set(id, current)
    }
  }

  const items = [...itemsById.values()]
  items.sort((a, b) => Number(a.id.slice(3)) - Number(b.id.slice(3)))
  return items
}

const main = () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8')
  const items = parseCatalogItems(source)

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const bsCatalog = {
    meta: {
      version: '1.1',
      generatedAt: new Date().toISOString(),
      sourceFile: 'docs/operations/r18-requirement-dev-mapping.md',
      count: items.length,
    },
    items,
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(bsCatalog, null, 2)}\n`)

  if (!fs.existsSync(COVERAGE_MATRIX_PATH)) {
    const coverageMatrix = {
      meta: {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        bsCatalogPath: '.trae/compliance/bs-catalog.json',
      },
      items: [],
    }

    fs.writeFileSync(
      COVERAGE_MATRIX_PATH,
      `${JSON.stringify(coverageMatrix, null, 2)}\n`,
    )
  }

  process.stdout.write(
    `bs-catalog generated: ${path.relative(ROOT, OUTPUT_PATH)} (count=${items.length})\n`,
  )
}

main()
