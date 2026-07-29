// scripts/sync-page-tests.ts
// E54 同步: 清除 page.test.tsx 中残留的 AdminPermissionGate / sourceEvidence 断言
// 策略:
//   1) 找到含 'AdminPermissionGate' 的 describe 块（含权限边界断言）→ 整块删除
//   2) 找到含 'sourceEvidence.' 的 describe 块（含来源态透明化断言）→ 整块删除
//   3) 替换单行 assert.ok(SRC.includes('AdminPermissionGate')) 为反向断言
//   4) 替换 '应接入管理员权限边界' 描述为 '已移除权限边界（E54 拍平）'
//
// 安全机制: 仅在明确块边界下删除（line-based stack tracking），不依赖多行正则
// 用法:   tsx scripts/sync-page-tests.ts [app-dir]
import * as fs from 'node:fs'
import * as path from 'node:path'

const TARGET_DIR = process.argv[2] ?? 'apps/admin-web/app'

interface BlockMatch {
  startLine: number
  endLine: number
  text: string
}

function findDescribeBlocksContaining(content: string, marker: string): BlockMatch[] {
  const lines = content.split('\n')
  const blocks: BlockMatch[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const describeMatch = line.match(/^\s*describe\s*\(/)
    if (describeMatch) {
      // 找到匹配的右括号: 跨多行 `describe(\s*[`'"]...['"]\s*,\s*\(\s*\)\s*=>\s*\{`
      // 简单起见：从该 describe 行起，扫描到下一个匹配 '});' 同行描述块结束位置
      // 关键: 用括号配对 + 单引号/双引号/反引号字符串保护
      let depth = 0
      let started = false
      let bodyStart = -1
      const startLine = i
      for (let j = i; j < lines.length; j++) {
        const cur = lines[j]
        for (let k = 0; k < cur.length; k++) {
          const c = cur[k]
          if (c === '{') { depth++; started = true; if (bodyStart < 0) bodyStart = j }
          else if (c === '}') { depth-- }
        }
        if (started && depth === 0) {
          // 块结束于第 j 行
          // 收集该块文本
          const blockText = lines.slice(startLine, j + 1).join('\n')
          if (blockText.includes(marker)) {
            blocks.push({ startLine: startLine, endLine: j, text: blockText })
          }
          i = j + 1
          break
        }
      }
      if (!started) {
        i++
      }
    } else {
      i++
    }
  }
  return blocks
}

function processFile(filePath: string): { changed: boolean; removed: number } {
  const original = fs.readFileSync(filePath, 'utf-8')
  let content = original
  let totalRemoved = 0

  // 1) 收集所有要删除的 describe 块（AdminPermissionGate / sourceEvidence）
  const allBlocks: BlockMatch[] = [
    ...findDescribeBlocksContaining(content, 'AdminPermissionGate'),
    ...findDescribeBlocksContaining(content, 'sourceEvidence'),
  ]

  // 去重并按行号倒序
  const unique = new Map<string, BlockMatch>()
  for (const b of allBlocks) {
    const key = `${b.startLine}:${b.endLine}`
    if (!unique.has(key)) unique.set(key, b)
  }
  const blocksToDelete = Array.from(unique.values()).sort((a, b) => b.startLine - a.startLine)

  for (const b of blocksToDelete) {
    const lines = content.split('\n')
    lines.splice(b.startLine, b.endLine - b.startLine + 1)
    content = lines.join('\n')
    totalRemoved++
  }

  // 2) 单行反向断言替换（即使整块删除后还有遗留单行）
  content = content.replace(
    /assert\.ok\(SRC\.includes\(\s*['"]AdminPermissionGate['"]\s*\)\)/g,
    "assert.ok(!SRC.includes('AdminPermissionGate'), 'AdminPermissionGate 已通过 E54 拍平移除')"
  )
  content = content.replace(
    /assert\.ok\(PAGE_SRC\.includes\(\s*['"]AdminPermissionGate['"]\s*\)\)/g,
    "assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'AdminPermissionGate 已通过 E54 拍平移除')"
  )
  content = content.replace(
    /assert\.ok\(\s*\/AdminPermissionGate\/\.test\(sourceContent\)\s*\)/g,
    "assert.ok(!/AdminPermissionGate/.test(sourceContent), 'AdminPermissionGate 已通过 E54 拍平移除')"
  )

  // 3) 替换"应接入管理员权限边界"描述
  content = content.replace(
    /it\((['"])应接入管理员权限边界\1,/g,
    "it($1已通过 E54 拍平移除 AdminPermissionGate$1,"
  )
  content = content.replace(
    /it\((['"])接入管理员权限边界\1,/g,
    "it($1已通过 E54 拍平移除 AdminPermissionGate$1,"
  )

  const changed = content !== original
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8')
  }
  return { changed, removed: totalRemoved }
}

function main() {
  const stat = { scanned: 0, changed: 0, removedBlocks: 0 }
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.isFile() && (entry.name === 'page.test.tsx' || entry.name === 'page.test.ts')) {
        stat.scanned++
        const r = processFile(full)
        if (r.changed) {
          stat.changed++
          stat.removedBlocks += r.removed
          console.log(`✓ ${full}: removed ${r.removed} describe blocks`)
        }
      }
    }
  }
  walk(TARGET_DIR)
  console.log(`\nDone. Scanned: ${stat.scanned}, Changed: ${stat.changed}, Blocks removed: ${stat.removedBlocks}`)
}

main()
