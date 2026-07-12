import re
path = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/tenant-config/tenant-config.service.ts'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find all 'createdAt: now,' lines that are in a seed block
# Seed blocks start with 'id: cfg-seed-store-*' or 'id: cfg-seed-brand-*'
# Walk lines, track when in a seed block, then add fromSeed line after createdAt: now,

in_seed_block = False
seed_type = None
out_lines = []
for i, line in enumerate(lines):
    if "id: 'cfg-seed-store-" in line or "id: 'cfg-seed-brand-" in line or "id: 'cfg-seed-store-tax'" in line or "id: 'cfg-seed-brand-audit'" in line or "id: 'cfg-seed-brand-color'" in line:
        in_seed_block = True
    if in_seed_block and line.rstrip() == "          }":
        # Insert fromSeed: true, before this closing brace
        out_lines.append("          fromSeed: true,\n")
        in_seed_block = False
    out_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(out_lines)
print(f'fromSeed count: {sum(1 for _ in open(path) if "fromSeed: true" in _)}')
