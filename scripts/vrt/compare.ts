/**
 * VRT Compare Tool · 对比 baseline vs screenshots 输出 diff 报告
 *
 * 用法:
 *   tsx scripts/vrt/compare.ts
 *
 * 依赖:
 *   pnpm add -D pixelmatch
 */

import path from 'node:path'
import fs from 'node:fs'
import { createCanvas, loadImage } from 'canvas'
import pixelmatch from 'pixelmatch'

const ROOT = path.resolve(__dirname, '../..')
const VRT_DIR = path.resolve(ROOT, 'scripts/vrt')
const BASELINE_DIR = path.resolve(VRT_DIR, 'baseline')
const SCREENSHOTS_DIR = path.resolve(VRT_DIR, 'screenshots')
const DIFFS_DIR = path.resolve(VRT_DIR, 'diffs')
const CONFIG_PATH = path.resolve(VRT_DIR, 'vrt.config.json')

interface DiffResult {
  pageName: string
  device: string
  mismatchPixels: number
  totalPixels: number
  mismatchPercent: number
  threshold: number
  status: 'pass' | 'fail' | 'missing-baseline'
}

interface VRTConfig {
  threshold: number
  includeAA: boolean
  alpha: number
  diffColor: [number, number, number]
}

async function compareImages(baselinePath: string, screenshotPath: string, diffPath: string, config: VRTConfig): Promise<{ mismatchPixels: number; totalPixels: number }> {
  const baselineImg = await loadImage(baselinePath)
  const screenshotImg = await loadImage(screenshotPath)

  const width = baselineImg.width
  const height = baselineImg.height

  const canvas1 = createCanvas(width, height)
  const ctx1 = canvas1.getContext('2d')
  ctx1.drawImage(baselineImg, 0, 0)

  const canvas2 = createCanvas(width, height)
  const ctx2 = canvas2.getContext('2d')
  ctx2.drawImage(screenshotImg, 0, 0)

  const diffCanvas = createCanvas(width, height)
  const diffCtx = diffCanvas.getContext('2d')
  const diffImageData = diffCtx.createImageData(width, height)

  const img1Data = ctx1.getImageData(0, 0, width, height).data
  const img2Data = ctx2.getImageData(0, 0, width, height).data

  const mismatchPixels = pixelmatch(img1Data, img2Data, diffImageData.data, width, height, {
    threshold: config.threshold,
    includeAA: config.includeAA,
    alpha: config.alpha,
    diffColor: config.diffColor,
  })

  diffCtx.putImageData(diffImageData, 0, 0)
  const buffer = diffCanvas.toBuffer('image/png')
  fs.writeFileSync(diffPath, buffer)

  return { mismatchPixels, totalPixels: width * height }
}

async function main() {
  const config: VRTConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))

  if (!fs.existsSync(BASELINE_DIR)) {
    console.error('❌ 基线目录不存在！请先运行: tsx scripts/vrt/snapshot.ts --baseline')
    process.exit(1)
  }

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    console.error('❌ 截图目录不存在！请先运行: tsx scripts/vrt/snapshot.ts')
    process.exit(1)
  }

  if (!fs.existsSync(DIFFS_DIR)) fs.mkdirSync(DIFFS_DIR, { recursive: true })

  const baselineFiles = fs.readdirSync(BASELINE_DIR).filter(f => f.endsWith('.png'))
  const results: DiffResult[] = []

  console.log('=== VRT 对比中 ===\n')

  for (const file of baselineFiles) {
    const [pageName, devicePart] = file.replace('.png', '').split('-')
    const device = file.includes('tablet') ? 'tablet' : 'desktop'

    const baselinePath = path.resolve(BASELINE_DIR, file)
    const screenshotPath = path.resolve(SCREENSHOTS_DIR, file)

    if (!fs.existsSync(screenshotPath)) {
      results.push({ pageName, device, mismatchPixels: 0, totalPixels: 0, mismatchPercent: 0, threshold: config.threshold, status: 'missing-baseline' })
      console.log(`⚠️  [${device}] ${pageName} → 截图缺失`)
      continue
    }

    const diffPath = path.resolve(DIFFS_DIR, file)
    const { mismatchPixels, totalPixels } = await compareImages(baselinePath, screenshotPath, diffPath, config)
    const mismatchPercent = (mismatchPixels / totalPixels) * 100
    const status = mismatchPercent <= config.threshold * 100 ? 'pass' : 'fail'

    results.push({ pageName, device, mismatchPixels, totalPixels, mismatchPercent, threshold: config.threshold, status })
    const icon = status === 'pass' ? '✅' : '❌'
    console.log(`${icon} [${device}] ${pageName}: ${mismatchPercent.toFixed(2)}% diff (threshold: ${(config.threshold * 100).toFixed(0)}%)`)
  }

  // Generate HTML report
  const html = generateReport(results)
  const reportPath = path.resolve(DIFFS_DIR, 'report.html')
  fs.writeFileSync(reportPath, html)

  const pass = results.filter(r => r.status === 'pass').length
  const fail = results.filter(r => r.status === 'fail').length
  const missing = results.filter(r => r.status === 'missing-baseline').length

  console.log(`\n=== VRT 对比完成 ===`)
  console.log(`总计: ${results.length} | 通过: ${pass} | 失败: ${fail} | 基线缺失: ${missing}`)
  console.log(`报告: ${reportPath}`)

  if (fail > 0) process.exit(1)
}

function generateReport(results: DiffResult[]): string {
  const rows = results.map(r => `
    <tr class="${r.status}">
      <td>${r.pageName}</td>
      <td>${r.device}</td>
      <td>${r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️'}</td>
      <td>${r.status !== 'missing-baseline' ? r.mismatchPercent.toFixed(2) + '%' : 'N/A'}</td>
      <td>${r.status !== 'missing-baseline' ? `<img src="${r.pageName}-${r.device}.png" style="max-width:200px" />` : '—'}</td>
    </tr>
  `).join('\n')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>VRT 视觉回归测试报告</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; }
  h1 { color: #333; }
  table { border-collapse: collapse; width: 100%; margin-top: 16px; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5; }
  .pass { background: #f0fff0; }
  .fail { background: #fff0f0; }
  img { border: 1px solid #eee; }
</style>
</head><body>
<h1>VRT 视觉回归测试报告</h1>
<p>生成时间: ${new Date().toISOString()}</p>
<table><thead><tr><th>页面</th><th>设备</th><th>状态</th><th>差异率</th><th>Diff</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`
}

main().catch(err => {
  console.error('VRT compare failed:', err)
  process.exit(1)
})
