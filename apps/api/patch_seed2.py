import re
path = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/tenant-config/tenant-config.service.ts'
with open(path, 'r', encoding='utf-8') as f:
    s = f.read()

# createdAt: now, 之后,   }],   之前插入 fromSeed: true,
# 实际: createdAt: now,\n        }\n      ]
# 用 string replace: 在 "createdAt: now," + 任何空白 + "        }]," 之间插入
n0 = s.count("fromSeed: true")
print(f'Initial fromSeed count: {n0}')

# Store seeds: 4 个 (id starts with 'cfg-seed-store-')
s_new = re.sub(
    r"('cfg-seed-store-[^']+',[\s\S]*?createdAt: now,)\n(\s+}\n)",
    r"\1\n\2 fromSeed: true,\n",
    s,
)
n1 = s_new.count("fromSeed: true")
print(f'After store patches: {n1}')

s_new2 = re.sub(
    r"('cfg-seed-brand-[^']+',[\s\S]*?createdAt: now,)\n(\s+}\n)",
    r"\1\n\2 fromSeed: true,\n",
    s_new,
)
n2 = s_new2.count("fromSeed: true")
print(f'After brand patches: {n2}')

# Also patch legacy seeds (single map.set with object literal)
s_new3 = re.sub(
    r"(id: 'cfg-seed-(?:store-tax|brand-(?:audit|color))', key: '[^']+',[\s\S]*?createdAt: now,)\n(\s+}\)",
    r"\1\n\2,\n        fromSeed: true",
    s_new2,
)
n3 = s_new3.count("fromSeed: true")
print(f'After legacy patches: {n3}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(s_new3)
