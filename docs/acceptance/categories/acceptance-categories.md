# ACC-006: 商品分类 — Categories 验收文档

> 版本: v1.0 · 验收人: 树哥A · 验收日期: 2026-07-28
> 关联PRD: [PRD-010 商品分类](../prd/categories/prd-categories.md)
> 关联Phase: P-00
> 圈梁标记: 🏗️ 圈梁五道箍

---

## 1. 模块概述

商品分类模块为POS系统提供基础商品分类数据，预置10个分类(餐饮/服装/数码/日用品等)，支持完整CRUD+模糊搜索。本验收档覆盖分类查询、创建、删除、更新、搜索等全部功能及异常场景。

**验收范围:**
- 全部分类列表查询
- 按名称精确查询(含URL编码)
- 分类统计
- 创建分类(正例/反例)
- 更新分类
- 删除分类
- 模糊搜索
- 异常场景(不存在/重复/空名称)

---

## 2. 验收标准

### 2.1 分类查询

#### AC-CATEGORIES-10-01: findAll返回10个种子分类
- **Given** 系统初始化
- **When** GET /api/v1/categories
- **Then** 返回10个分类, 第一个name=餐饮

#### AC-CATEGORIES-10-02: 返回独立副本
- **Given** 分类列表返回
- **When** 修改返回结果的productCount
- **Then** 再次查询, productCount不变, 内部状态不受影响

#### AC-CATEGORIES-10-03: 每个分类字段完整
- **Given** findAll返回
- **When** 检查每个分类
- **Then** 每个都有name/description/productCount三个字段

#### AC-CATEGORIES-10-04: 按名称精确查找
- **Given** 分类"数码"存在
- **When** GET /api/v1/categories/数码
- **Then** 返回: name=数码, description包含"电子产品"

#### AC-CATEGORIES-10-05: 支持URL编码名称查询
- **Given** 分类"数码"存在
- **When** GET /api/v1/categories/%E6%95%B0%E7%A0%81
- **Then** 正确返回分类"数码"

#### AC-CATEGORIES-10-06: 查询不存在的分类
- **Given** 分类"不存在的分类"不存在
- **When** GET /api/v1/categories/不存在的分类
- **Then** 抛出NotFoundException

#### AC-CATEGORIES-10-07: 分类统计
- **Given** 种子数据10个分类
- **When** GET /api/v1/categories/stats
- **Then** total=10, categories包含"餐饮""服装"等

### 2.2 创建分类

#### AC-CATEGORIES-10-08: 创建成功
- **Given** 分类"生鲜"不存在
- **When** 创建(name=生鲜, description=新鲜蔬果)
- **Then** 创建成功, 返回分类 name=生鲜

#### AC-CATEGORIES-10-09: 重复名称拦截
- **Given** 分类"餐饮"已存在
- **When** 创建(name=餐饮)
- **Then** 抛出ConflictException, 提示"分类 餐饮 已存在"

#### AC-CATEGORIES-10-10: 空名称拦截
- **Given** 名称为空字符串
- **When** 创建(name= )
- **Then** 抛出BadRequestException, 提示"分类名称不能为空"

#### AC-CATEGORIES-10-11: 大小写不敏感去重
- **Given** 分类"餐饮"已存在
- **When** 创建(name=餐饮) (全角/半角相同)
- **Then** 抛出ConflictException

### 2.3 更新分类

#### AC-CATEGORIES-10-12: 更新描述
- **Given** 分类"数码"存在, description=电子产品、手机、电脑及配件
- **When** 更新(name=数码, description=智能电子产品)
- **Then** 更新成功, description=智能电子产品

#### AC-CATEGORIES-10-13: 更新productCount
- **Given** 分类"数码" productCount=0
- **When** 更新(name=数码, productCount=150)
- **Then** productCount=150

#### AC-CATEGORIES-10-14: 更新不存在的分类
- **Given** 分类"不存在"不存在
- **When** 更新(name=不存在)
- **Then** 抛出NotFoundException

### 2.4 删除分类

#### AC-CATEGORIES-10-15: 删除成功
- **Given** 分类"其他"存在
- **When** 删除(name=其他)
- **Then** 删除成功, 之后findAll返回9个分类

#### AC-CATEGORIES-10-16: 删除不存在的分类
- **Given** 分类"不存在"不存在
- **When** 删除(name=不存在)
- **Then** 抛出NotFoundException

### 2.5 模糊搜索

#### AC-CATEGORIES-10-17: 按名称关键词搜索
- **Given** 分类中有"数码""饮品"等
- **When** 搜索(keyword=数)
- **Then** 返回包含"数码"的分类, 不含不匹配的

#### AC-CATEGORIES-10-18: 按描述关键词搜索
- **Given** "餐饮"的描述含"食品"
- **When** 搜索(keyword=食品)
- **Then** 返回"餐饮"

#### AC-CATEGORIES-10-19: 搜索大小写不敏感
- **Given** 分类名称为中文(无大小写概念), 搜索英文关键词在描述中
- **When** 搜索(keyword=电子产品) 
- **Then** 返回包含"电子产品"描述的"数码"分类

#### AC-CATEGORIES-10-20: 空关键词搜索返回空
- **Given** 关键词为空字符串
- **When** 搜索(keyword= )
- **Then** 返回空数组[]

#### AC-CATEGORIES-10-21: URL编码删除
- **Given** 分类"数码"存在
- **When** 删除(name=%E6%95%B0%E7%A0%81)
- **Then** 删除成功, findAll返回9个

---

## 3. 测试场景清单

| 场景ID | 场景标题 | 模块 | 自动化 | 优先级 | 关联验收标准 |
|:-------|:---------|:-----|:------:|:------:|:------------|
| TC-10-01 | findAll返回10个 | 查询 | ✅ | P0 | AC-CATEGORIES-10-01 |
| TC-10-02 | 返回独立副本 | 查询 | ✅ | P1 | AC-CATEGORIES-10-02 |
| TC-10-03 | 字段完整性校验 | 查询 | ✅ | P1 | AC-CATEGORIES-10-03 |
| TC-10-04 | 按名称精确查找 | 查询 | ✅ | P0 | AC-CATEGORIES-10-04 |
| TC-10-05 | URL编码名称查询 | 查询 | ✅ | P1 | AC-CATEGORIES-10-05 |
| TC-10-06 | 不存在的分类查询 | 查询 | ✅ | P0 | AC-CATEGORIES-10-06 |
| TC-10-07 | 分类统计 | 统计 | ✅ | P1 | AC-CATEGORIES-10-07 |
| TC-10-08 | 创建成功 | 创建 | ✅ | P0 | AC-CATEGORIES-10-08 |
| TC-10-09 | 重复名称拦截 | 创建 | ✅ | P0 | AC-CATEGORIES-10-09 |
| TC-10-10 | 空名称拦截 | 创建 | ✅ | P0 | AC-CATEGORIES-10-10 |
| TC-10-11 | 大小写不敏感去重 | 创建 | ✅ | P1 | AC-CATEGORIES-10-11 |
| TC-10-12 | 更新描述 | 更新 | ✅ | P0 | AC-CATEGORIES-10-12 |
| TC-10-13 | 更新productCount | 更新 | ✅ | P1 | AC-CATEGORIES-10-13 |
| TC-10-14 | 更新不存在的分类 | 更新 | ✅ | P0 | AC-CATEGORIES-10-14 |
| TC-10-15 | 删除成功 | 删除 | ✅ | P0 | AC-CATEGORIES-10-15 |
| TC-10-16 | 删除不存在的分类 | 删除 | ✅ | P0 | AC-CATEGORIES-10-16 |
| TC-10-17 | 按名称关键词搜索 | 搜索 | ✅ | P0 | AC-CATEGORIES-10-17 |
| TC-10-18 | 按描述关键词搜索 | 搜索 | ✅ | P1 | AC-CATEGORIES-10-18 |
| TC-10-19 | 大小写不敏感搜索 | 搜索 | ✅ | P1 | AC-CATEGORIES-10-19 |
| TC-10-20 | 空关键词搜索空 | 搜索 | ✅ | P1 | AC-CATEGORIES-10-20 |
| TC-10-21 | URL编码删除 | 删除 | ✅ | P1 | AC-CATEGORIES-10-21 |

**测试场景汇总:** 21场景 | P0=11 | P1=10 | 自动化覆盖=100%

---

## 4. 验收结论

| 验收项 | 结果 | 说明 |
|:-------|:----:|:-----|
| 功能完整度 | ⬜ 待测 | 等待开发完成后执行 |
| 自动化测试 | 21/21 | 全量测试用例已定义 |
| 异常覆盖 | 5/5 | 不存在/重复/空名称/URL编码/大小写不敏感 |
| 边界覆盖 | 有 | 空关键词搜索、URL编码查询、字段完整性 |
