/**
 * 知识库 Markdown → PostgreSQL 导入脚本
 * 将所有 docs/knowledge/**/*.md 导入 kb_document 表
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const KNOWLEDGE_ROOT = path.resolve(__dirname, '..', 'docs/knowledge');

interface CategoryMap {
  [pathPrefix: string]: number;
}

async function loadCategories(): Promise<CategoryMap> {
  const cats = await prisma.$queryRawUnsafe<Array<{ id: number; path_prefix: string }>>(
    `SELECT id, path_prefix FROM kb_category ORDER BY sort_order`
  );
  const map: CategoryMap = {};
  for (const c of cats) {
    map[c.path_prefix] = c.id;
  }
  return map;
}

function findCategory(filePath: string, catMap: CategoryMap): number | null {
  // 匹配最长的前缀
  let bestMatch: { prefix: string; id: number } | null = null;
  for (const [prefix, id] of Object.entries(catMap)) {
    if (filePath.startsWith(prefix)) {
      if (!bestMatch || prefix.length > bestMatch.prefix.length) {
        bestMatch = { prefix, id };
      }
    }
  }
  return bestMatch?.id ?? null;
}

function extractDate(filePath: string): string | null {
  // 从路径中提取日期，如 2026-07-29
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function extractTags(content: string, filePath: string): string[] {
  const tags: Set<string> = new Set();
  
  // 从文件名提取标签
  const fileName = path.basename(filePath, '.md');
  if (fileName.includes('morning')) tags.add('晨间');
  if (fileName.includes('evening')) tags.add('晚间');
  if (fileName.includes('afternoon')) tags.add('午后');
  if (fileName.includes('alignment')) tags.add('对齐');
  if (fileName.includes('evolution')) tags.add('进化');
  if (fileName.includes('expert')) tags.add('专家');
  if (fileName.includes('v24')) tags.add('v24');
  if (fileName.includes('v23')) tags.add('v23');
  if (fileName.includes('v21')) tags.add('v21');
  if (fileName.includes('signoff')) tags.add('签署');
  if (fileName.includes('review')) tags.add('回顾');
  if (fileName.includes('brief')) tags.add('简报');
  if (fileName.includes('test')) tags.add('测试');
  if (fileName.includes('e2e')) tags.add('e2e');
  if (fileName.includes('api')) tags.add('api');
  if (fileName.includes('phase')) tags.add('phase');
  if (fileName.includes('gate')) tags.add('gate');
  if (fileName.includes('security')) tags.add('安全');
  if (fileName.includes('compliance')) tags.add('合规');
  if (fileName.includes('prd')) tags.add('prd');
  if (fileName.includes('adr')) tags.add('adr');
  
  // 从路径提取标签
  if (filePath.includes('expert-team')) tags.add('专家团队');
  if (filePath.includes('daily-brief')) tags.add('每日简报');
  if (filePath.includes('daily-review')) tags.add('每日回顾');
  if (filePath.includes('audit')) tags.add('审计');
  if (filePath.includes('sprint')) tags.add('sprint');
  if (filePath.includes('archive')) tags.add('归档');
  if (filePath.includes('evolution')) tags.add('进化');
  if (filePath.includes('acceptance')) tags.add('验收');
  
  return Array.from(tags);
}

async function importFile(
  filePath: string, 
  relativePath: string, 
  catMap: CategoryMap,
  stats: { imported: number; skipped: number; errors: number }
) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const slug = path.basename(filePath, '.md');
    const title = slug.replace(/-/g, ' ').replace(/_/g, ' ');
    const categoryId = findCategory(relativePath, catMap);
    const sourceDate = extractDate(relativePath);
    const lines = content.split('\n');
    const tags = extractTags(content, relativePath);
    
    // 检查是否已存在
    const existing = await prisma.$queryRawUnsafe<Array<{ id: number; content_hash: string }>>(
      `SELECT id, content_hash FROM kb_document WHERE file_path = $1 LIMIT 1`,
      relativePath
    );
    
    if (existing.length > 0) {
      const doc = existing[0];
      if (doc.content_hash === contentHash) {
        stats.skipped++;
        return; // 内容没变，跳过
      }
      // 更新
      await prisma.$executeRawUnsafe(
        `UPDATE kb_document 
         SET content = $1, content_hash = $2, word_count = $3, line_count = $4, 
             tags = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        content, contentHash, content.split(/\s+/).length, lines.length, tags, doc.id
      );
      // 记录历史
      await prisma.$executeRawUnsafe(
        `INSERT INTO kb_document_history (document_id, content, content_hash, word_count)
         VALUES ($1, $2, $3, $4)`,
        doc.id, content, contentHash, content.split(/\s+/).length
      );
      stats.imported++;
    } else {
      // 新增
      await prisma.$executeRawUnsafe(
        `INSERT INTO kb_document (category_id, title, slug, file_path, content, content_hash, 
          word_count, line_count, tags, source_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')`,
        categoryId, title, slug, relativePath, content, contentHash,
        content.split(/\s+/).length, lines.length, tags, sourceDate
      );
      stats.imported++;
    }
  } catch (err) {
    console.error(`❌ ${relativePath}:`, err);
    stats.errors++;
  }
}

async function walkDir(dir: string, baseDir: string, catMap: CategoryMap, stats: any): Promise<void> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, baseDir, catMap, stats);
    } else if (entry.name.endsWith('.md')) {
      const relativePath = path.relative(baseDir, fullPath);
      await importFile(fullPath, relativePath, catMap, stats);
    }
  }
}

async function main() {
  console.log('📚 开始导入知识库到 PostgreSQL...\n');
  
  const catMap = await loadCategories();
  console.log(`📂 加载了 ${Object.keys(catMap).length} 个分类\n`);
  
  const stats = { imported: 0, skipped: 0, errors: 0 };
  
  await walkDir(KNOWLEDGE_ROOT, path.resolve(KNOWLEDGE_ROOT, '..'), catMap, stats);
  
  console.log(`\n📊 导入完成:`);
  console.log(`   ✅ 导入/更新: ${stats.imported}`);
  console.log(`   ⏭️  跳过(未变): ${stats.skipped}`);
  console.log(`   ❌ 错误: ${stats.errors}`);
  
  // 更新根目录 md 文件
  const rootDir = path.resolve(KNOWLEDGE_ROOT);
  const rootFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.md'));
  for (const file of rootFiles) {
    const fullPath = path.join(rootDir, file);
    const relativePath = path.relative(path.resolve(rootDir, '..'), fullPath);
    await importFile(fullPath, relativePath, catMap, stats);
  }
  
  await prisma.$disconnect();
  console.log('✅ 全部完成');
}

main().catch(console.error);
