/**
 * 知识库 Markdown → PostgreSQL 导入脚本
 */
import { createHash } from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { join, relative, basename, resolve, dirname } from 'path';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying' });

const PROJECT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const KB_ROOT = join(PROJECT, 'docs/knowledge');

async function loadCategories(client) {
  const res = await client.query('SELECT id, path_prefix FROM kb_category ORDER BY sort_order');
  const map = {};
  for (const row of res.rows) {
    map[row.path_prefix] = row.id;
  }
  return map;
}

function findCategory(relPath, catMap) {
  let best = null;
  let bestLen = 0;
  for (const [prefix, id] of Object.entries(catMap)) {
    if (relPath.startsWith(prefix) && prefix.length > bestLen) {
      best = id;
      bestLen = prefix.length;
    }
  }
  return best;
}

function extractDate(fpath) {
  const m = fpath.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function sha256(s) {
  return createHash('sha256').update(s).digest('hex');
}

function walkMdFiles(dir, results) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      walkMdFiles(full, results);
    } else if (e.name.endsWith('.md')) {
      results.push(full);
    }
  }
}

async function main() {
  const client = await pool.connect();
  
  try {
    const catMap = await loadCategories(client);
    console.log(`📂 分类: ${Object.keys(catMap).length}`);
    
    const files = [];
    walkMdFiles(KB_ROOT, files);
    // 也要加上根目录下的md文件
    for (const f of readdirSync(KB_ROOT)) {
      if (f.endsWith('.md')) files.push(join(KB_ROOT, f));
    }
    
    console.log(`📄 文件: ${files.length}`);
    
    let imported = 0, skipped = 0, errors = 0;
    
    // 批量查询已存在文档
    const relPaths = files.map(f => relative(PROJECT, f));
    const existing = await client.query(
      'SELECT file_path, content_hash FROM kb_document WHERE file_path = ANY($1)',
      [relPaths]
    );
    const existingMap = {};
    for (const row of existing.rows) {
      existingMap[row.file_path] = row.content_hash;
    }
    
    for (let i = 0; i < files.length; i++) {
      const fullPath = files[i];
      const relPath = relPaths[i];
      
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const hash = sha256(content);
        const slug = basename(fullPath, '.md');
        const title = slug.replace(/[_-]/g, ' ');
        const catId = findCategory(relPath, catMap);
        const srcDate = extractDate(relPath);
        const lines = content.split('\n');
        const wc = content.split(/\s+/).filter(Boolean).length;
        
        if (existingMap[relPath]) {
          if (existingMap[relPath] === hash) {
            skipped++;
          } else {
            await client.query(
              `UPDATE kb_document 
               SET content = $1, content_hash = $2, word_count = $3, line_count = $4, updated_at = CURRENT_TIMESTAMP
               WHERE file_path = $5`,
              [content, hash, wc, lines.length, relPath]
            );
            imported++;
          }
        } else {
          await client.query(
            `INSERT INTO kb_document (category_id, title, slug, file_path, content, content_hash, word_count, line_count, source_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')`,
            [catId, title, slug, relPath, content, hash, wc, lines.length, srcDate]
          );
          imported++;
        }
        
        if ((i + 1) % 100 === 0) {
          console.log(`  进度: ${i + 1}/${files.length} (导入:${imported} 跳过:${skipped})`);
        }
      } catch (err) {
        errors++;
        if (errors <= 5) console.error(`❌ ${relPath}: ${err.message}`);
      }
    }
    
    console.log(`\n📊 完成: 导入=${imported} 跳过=${skipped} 错误=${errors}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
