# P-65 数据可视化平台详细设计文档

## 1. 概述

### 1.1 模块定位

数据可视化平台是 M5 Platform V18 数据智能体系的最终展示层，负责：

- **自助式 BI 分析**: 拖拽式报表构建、多维分析、数据探索
- **仪表板系统**: 可视化组件库、实时数据刷新、交互式筛选
- **大屏展示**: 数据驾驶舱、数字孪生、3D 可视化
- **移动端 BI**: 响应式适配、离线访问、推送通知
- **嵌入式分析**: iframe/JS SDK、白标集成、API 导出

### 1.2 核心目标

| 指标 | 目标值 | 验收标准 |
|------|--------|----------|
| 首屏加载时间 | < 2s | 仪表板首屏 |
| 图表渲染时间 | < 100ms | 简单图表 |
| 数据刷新延迟 | < 5s | 实时数据流 |
| 并发用户数 | > 5000 | 单实例 |
| 移动端适配度 | 100% | 核心功能 |
| 大屏分辨率支持 | 8K | 7680×4320 |

### 1.3 技术架构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        数据可视化平台架构                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        展示层 (Presentation)                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │   Web BI     │  │  Mobile App  │  │   Big Screen │  │ Embedded │  │   │
│  │  │   (React)    │  │  (React Native│  │   (Canvas)   │  │  (SDK)   │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │   │
│  │         └─────────────────┴───────────────────┘                │         │   │
│  │                              │                                 │         │   │
│  │                   ┌──────────▼──────────┐                      │         │   │
│  │                   │   Visualization Engine                      │         │   │
│  │                   │   (ECharts/AntV/D3)  │                      │         │   │
│  │                   └──────────┬──────────┘                      │         │   │
│  └─────────────────────────────┼─────────────────────────────────┘         │
│                                │                                              │
│  ┌─────────────────────────────▼─────────────────────────────────┐           │
│  │                      核心服务层 (Core Services)                      │           │
│  │                                                                  │           │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │           │
│  │  │  Dashboard Builder│  │  Query Engine   │  │  Data Source   │  │           │
│  │  │  (仪表板构建器)   │  │  (查询引擎)     │  │  (数据源管理)  │  │           │
│  │  │                   │  │                   │  │                   │  │           │
│  │  │ • Layout Engine   │  │ • SQL Builder   │  │ • Connection   │  │           │
│  │  │ • Component Lib   │  │ • Query Cache   │  │ • Schema Sync  │  │           │
│  │  │ • Theme System    │  │ • Data Transform│  │ • Health Check │  │           │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │           │
│  │           │                    │                    │           │
│  │           └────────────────────┼────────────────────┘           │
│  │                                │                                │
│  │                     ┌───────────▼───────────┐                      │
│  │                     │   Collaboration     │                      │
│  │                     │   (协作服务)         │                      │
│  │                     │                     │                      │
│  │                     │ • Real-time Sync    │                      │
│  │                     │ • Comment System    │                      │
│  │                     │ • Version Control   │                      │
│  │                     └───────────┬───────┘                      │
│  │  └───────────────────────────────────┼──────────────────────────────┘
│  │                                      │
│  │  ┌──────────────────────────────────▼──────────────────────────────┐
│  │  │                        数据层 (Data Sources)                    │
│  │  │                                                                  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  │  │  PostgreSQL  │  │  ClickHouse  │  │    Redis     │          │
│  │  │  │  (元数据)    │  │  (分析数据)  │  │   (缓存)     │          │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘          │
│  │  │                                                                  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  │  │ Elasticsearch│  │    MinIO     │  │  Data API    │          │
│  │  │  │   (搜索)     │  │  (文件存储)  │  │  (数据网关)  │          │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘          │
│  │  │                                                                  │
│  │  └──────────────────────────────────────────────────────────────────┘
│  │                                                                                  │
│  └──────────────────────────────────────────────────────────────────────────────────┘
```

## 2. 核心组件实现

### 2.1 仪表板构建引擎

```typescript
// apps/api/src/modules/visualization/services/dashboard-builder.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Dashboard, DashboardLayout, ComponentConfig } from '../entities/dashboard.entity'
import { DataSourceService } from './data-source.service'
import { QueryEngineService } from './query-engine.service'

// 布局配置
interface LayoutConfig {
  type: 'grid' | 'free' | 'tab' | 'accordion'
  columns?: number
  rowHeight?: number
  margin?: [number, number]
  containerPadding?: [number, number]
  breakpoints?: Record<string, { columns: number; width: number }>
}

// 组件定义
interface ComponentDefinition {
  id: string
  type: string
  category: 'chart' | 'table' | 'metric' | 'filter' | 'media' | 'custom'
  name: string
  icon: string
  description?: string
  defaultConfig: Record<string, unknown>
  schema: ComponentSchema
  dataRequirements?: DataRequirement[]
  events?: ComponentEvent[]
}

interface ComponentSchema {
  properties: Record<string, SchemaProperty>
  required?: string[]
  dependencies?: Record<string, string[]>
}

interface SchemaProperty {
  type: string
  title?: string
  description?: string
  default?: unknown
  enum?: unknown[]
  format?: string
  properties?: Record<string, SchemaProperty>
  items?: SchemaProperty
  min?: number
  max?: number
  step?: number
}

interface DataRequirement {
  name: string
  type: 'single' | 'array' | 'time-series' | 'tree' | 'graph'
  fields: DataField[]
  minRows?: number
  maxRows?: number
}

interface DataField {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'geo' | 'image' | 'url'
  required?: boolean
  description?: string
}

interface ComponentEvent {
  name: string
  description?: string
  payload?: Record<string, string>
}

// 主题配置
interface ThemeConfig {
  name: string
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    info: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    chart: string[]
  }
  typography: {
    fontFamily: string
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
    }
    fontWeight: {
      light: number
      normal: number
      medium: number
      semibold: number
      bold: number
    }
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  borderRadius: {
    none: string
    sm: string
    base: string
    md: string
    lg: string
    xl: string
    full: string
  }
  shadows: {
    none: string
    sm: string
    base: string
    md: string
    lg: string
    xl: string
  }
}

@Injectable()
export class DashboardBuilderService {
  private readonly logger = new Logger(DashboardBuilderService.name)

  constructor(
    @InjectRepository(Dashboard)
    private readonly dashboardRepo: Repository<Dashboard>,
    private readonly dataSourceService: DataSourceService,
    private readonly queryEngine: QueryEngineService
  ) {}

  /**
   * 创建仪表板
   */
  async createDashboard(config: {
    name: string
    description?: string
    layout: LayoutConfig
    theme?: string
    ownerId: string
    workspaceId: string
    isPublic?: boolean
  }): Promise<Dashboard> {
    const dashboard = this.dashboardRepo.create({
      name: config.name,
      description: config.description,
      layout: config.layout as unknown as DashboardLayout,
      theme: config.theme || 'default',
      ownerId: config.ownerId,
      workspaceId: config.workspaceId,
      isPublic: config.isPublic || false,
      components: [],
      filters: [],
      version: 1
    })

    return this.dashboardRepo.save(dashboard)
  }

  /**
   * 添加组件到仪表板
   */
  async addComponent(
    dashboardId: string,
    component: {
      type: string
      name: string
      layout: {
        x: number
        y: number
        width: number
        height: number
      }
      config: Record<string, unknown>
      dataSource?: {
        type: 'sql' | 'api' | 'static' | 'widget'
        config: Record<string, unknown>
      }
    }
  ): Promise<void> {
    const dashboard = await this.dashboardRepo.findOne({
      where: { id: dashboardId }
    })

    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`)
    }

    const newComponent = {
      id: `comp_${Date.now()}`,
      ...component,
      createdAt: new Date()
    } as ComponentConfig

    dashboard.components = [...dashboard.components, newComponent]
    dashboard.version += 1

    await this.dashboardRepo.save(dashboard)
  }

  /**
   * 获取组件数据
   */
  async getComponentData(
    dashboardId: string,
    componentId: string,
    filters?: Record<string, unknown>
  ): Promise<unknown> {
    const dashboard = await this.dashboardRepo.findOne({
      where: { id: dashboardId }
    })

    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`)
    }

    const component = dashboard.components.find(c => c.id === componentId)
    if (!component) {
      throw new Error(`Component not found: ${componentId}`)
    }

    // 根据数据源类型获取数据
    switch (component.dataSource?.type) {
      case 'sql':
        return this.queryEngine.executeQuery({
          sql: component.dataSource.config.sql as string,
          parameters: filters
        })

      case 'api':
        return this.dataSourceService.callApi({
          endpoint: component.dataSource.config.endpoint as string,
          method: (component.dataSource.config.method as string) || 'GET',
          params: filters
        })

      case 'static':
        return component.dataSource.config.data

      default:
        return null
    }
  }

  /**
   * 获取可用组件列表
   */
  getAvailableComponents(): ComponentDefinition[] {
    return [
      // 图表组件
      {
        id: 'line-chart',
        type: 'LineChart',
        category: 'chart',
        name: '折线图',
        icon: 'chart-line',
        description: '展示数据随时间变化的趋势',
        defaultConfig: {
          xAxis: { type: 'category' },
          yAxis: { type: 'value' },
          smooth: true,
          showSymbol: false
        },
        schema: this.getChartSchema(),
        dataRequirements: [{
          name: 'data',
          type: 'array',
          fields: [
            { name: 'x', type: 'string', required: true },
            { name: 'y', type: 'number', required: true }
          ]
        }]
      },
      {
        id: 'bar-chart',
        type: 'BarChart',
        category: 'chart',
        name: '柱状图',
        icon: 'chart-bar',
        description: '比较不同类别的数值大小',
        defaultConfig: {
          xAxis: { type: 'category' },
          yAxis: { type: 'value' },
          barWidth: '60%'
        },
        schema: this.getChartSchema(),
        dataRequirements: [{
          name: 'data',
          type: 'array',
          fields: [
            { name: 'category', type: 'string', required: true },
            { name: 'value', type: 'number', required: true }
          ]
        }]
      },
      {
        id: 'pie-chart',
        type: 'PieChart',
        category: 'chart',
        name: '饼图',
        icon: 'chart-pie',
        description: '展示各部分占整体的比例',
        defaultConfig: {
          radius: ['40%', '70%'],
          avoidLabelOverlap: false
        },
        schema: this.getChartSchema(),
        dataRequirements: [{
          name: 'data',
          type: 'array',
          fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'value', type: 'number', required: true }
          ]
        }]
      },
      // 表格组件
      {
        id: 'data-table',
        type: 'DataTable',
        category: 'table',
        name: '数据表格',
        icon: 'table',
        description: '展示详细数据列表，支持排序和筛选',
        defaultConfig: {
          pagination: { pageSize: 10 },
          bordered: true,
          size: 'middle'
        },
        schema: {
          properties: {
            columns: {
              type: 'array',
              title: '列配置',
              items: {
                type: 'object',
                properties: {
                  dataIndex: { type: 'string', title: '字段名' },
                  title: { type: 'string', title: '列标题' },
                  width: { type: 'number', title: '宽度' },
                  sorter: { type: 'boolean', title: '可排序' },
                  filters: { type: 'array', title: '筛选项' }
                }
              }
            }
          }
        },
        dataRequirements: [{
          name: 'data',
          type: 'array',
          fields: []
        }]
      },
      // 指标卡组件
      {
        id: 'metric-card',
        type: 'MetricCard',
        category: 'metric',
        name: '指标卡',
        icon: 'card',
        description: '展示关键指标数值和变化趋势',
        defaultConfig: {
          prefix: '',
          suffix: '',
          precision: 2,
          showTrend: true,
          trendDirection: 'up-is-good'
        },
        schema: {
          properties: {
            title: { type: 'string', title: '标题' },
            value: { type: 'number', title: '当前值' },
            previousValue: { type: 'number', title: '对比值' },
            format: { type: 'string', title: '格式', enum: ['number', 'currency', 'percentage'] }
          }
        },
        dataRequirements: [{
          name: 'data',
          type: 'single',
          fields: [
            { name: 'value', type: 'number', required: true },
            { name: 'previousValue', type: 'number', required: false }
          ]
        }]
      },
      // 筛选器组件
      {
        id: 'filter-component',
        type: 'FilterComponent',
        category: 'filter',
        name: '筛选器',
        icon: 'filter',
        description: '为仪表板提供交互式数据筛选',
        defaultConfig: {
          type: 'select',
          allowClear: true,
          showSearch: true
        },
        schema: {
          properties: {
            type: {
              type: 'string',
              title: '筛选器类型',
              enum: ['select', 'multi-select', 'date-range', 'input', 'slider', 'radio', 'checkbox']
            },
            field: { type: 'string', title: '关联字段' },
            label: { type: 'string', title: '标签' },
            placeholder: { type: 'string', title: '占位符' }
          }
        },
        dataRequirements: [{
          name: 'options',
          type: 'array',
          fields: [
            { name: 'label', type: 'string', required: true },
            { name: 'value', type: 'string', required: true }
          ]
        }]
      }
    ]
  }

  private getChartSchema(): ComponentSchema {
    return {
      properties: {
        title: { type: 'string', title: '标题' },
        xAxis: {
          type: 'object',
          title: 'X轴配置',
          properties: {
            type: { type: 'string', enum: ['category', 'value', 'time'] },
            name: { type: 'string' },
            rotate: { type: 'number' }
          }
        },
        yAxis: {
          type: 'object',
          title: 'Y轴配置',
          properties: {
            type: { type: 'string', enum: ['value', 'category'] },
            name: { type: 'string' },
            min: { type: 'number' },
            max: { type: 'number' }
          }
        },
        legend: {
          type: 'object',
          title: '图例配置',
          properties: {
            show: { type: 'boolean' },
            position: { type: 'string', enum: ['top', 'bottom', 'left', 'right'] }
          }
        },
        tooltip: {
          type: 'object',
          title: '提示框配置',
          properties: {
            show: { type: 'boolean' },
            trigger: { type: 'string', enum: ['item', 'axis'] }
          }
        }
      }
    }
  }
}

// 实体类定义
export class Dashboard {
  id!: string
  name!: string
  description?: string
  layout!: DashboardLayout
  theme!: string
  ownerId!: string
  workspaceId!: string
  isPublic!: boolean
  components!: ComponentConfig[]
  filters!: FilterConfig[]
  version!: number
  createdAt!: Date
  updatedAt!: Date
}

export interface DashboardLayout {
  type: 'grid' | 'free'
  columns: number
  rowHeight: number
  margin: [number, number]
  containerPadding: [number, number]
}

export interface ComponentConfig {
  id: string
  type: string
  name: string
  layout: {
    x: number
    y: number
    width: number
    height: number
  }
  config: Record<string, unknown>
  dataSource?: {
    type: 'sql' | 'api' | 'static' | 'widget'
    config: Record<string, unknown>
  }
  createdAt: Date
}

export interface FilterConfig {
  id: string
  type: string
  field: string
  label: string
  defaultValue?: unknown
  config: Record<string, unknown>
}
```

### 2.2 大屏展示系统

```typescript
// apps/api/src/modules/visualization/services/big-screen.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BigScreen, ScreenLayout, ScreenComponent } from '../entities/big-screen.entity'

// 大屏分辨率预设
export type ScreenResolution = 
  | '1920x1080'   // FHD
  | '2560x1440'   // QHD
  | '3840x2160'   // 4K UHD
  | '7680x4320'   // 8K UHD
  | 'custom'

// 布局类型
export type LayoutType = 
  | 'grid'        // 网格布局
  | 'absolute'    // 绝对定位
  | 'flex'        // 弹性布局
  | 'split'       // 分割布局

// 组件类型
export type BigScreenComponentType =
  // 基础图表
  | 'line-chart' | 'bar-chart' | 'pie-chart' | 'scatter-chart'
  | 'radar-chart' | 'funnel-chart' | 'gauge-chart' | 'heatmap'
  // 地图
  | 'china-map' | 'world-map' | '3d-map' | 'heatmap-map'
  // 3D/特效
  | '3d-scene' | 'particle-effect' | 'digital-twin'
  // 媒体
  | 'video' | 'image' | 'webpage' | 'iframe'
  // 数据展示
  | 'counter' | 'text' | 'clock' | 'weather' | 'marquee'
  // 交互
  | 'button' | 'input' | 'dropdown' | 'date-picker'

// 动画效果
export interface AnimationConfig {
  entrance?: {
    type: 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'rotate'
    direction?: 'up' | 'down' | 'left' | 'right'
    duration: number
    delay?: number
    easing: string
  }
  update?: {
    type: 'morph' | 'transition' | 'pulse'
    duration: number
  }
  exit?: {
    type: 'fade' | 'slide' | 'zoom'
    duration: number
  }
  continuous?: {
    type: 'rotate' | 'pulse' | 'float' | 'shake'
    duration: number
    iterationCount: number | 'infinite'
  }
}

// 交互配置
export interface InteractionConfig {
  events: Array<{
    type: 'click' | 'hover' | 'dblclick' | 'select' | 'brush' | 'zoom'
    action: {
      type: 'link' | 'modal' | 'drawer' | 'tooltip' | 'filter' | 'callback'
      target?: string
      params?: Record<string, unknown>
    }
  }>
  drillDown?: {
    enabled: boolean
    levels: Array<{
      name: string
      field: string
      aggregation?: string
    }>
  }
  crossFilter?: {
    enabled: boolean
    affectedComponents: string[]
  }
}

// 数据源配置
export interface DataSourceConfig {
  type: 'sql' | 'api' | 'static' | 'realtime' | 'widget'
  config: {
    // SQL 类型
    sql?: string
    parameters?: Record<string, { type: string; default?: unknown }>
    
    // API 类型
    endpoint?: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    body?: Record<string, unknown>
    
    // 静态数据
    data?: unknown[]
    
    // 实时数据
    wsUrl?: string
    topic?: string
    
    // Widget 数据源
    widgetId?: string
    output?: string
  }
  refresh: {
    mode: 'manual' | 'interval' | 'realtime'
    interval?: number // 秒
  }
  transform?: {
    enabled: boolean
    script: string // JavaScript 数据转换脚本
  }
}

@Injectable()
export class BigScreenService {
  private readonly logger = new Logger(BigScreenService.name)

  constructor(
    @InjectRepository(BigScreen)
    private readonly bigScreenRepo: Repository<BigScreen>,
    private readonly queryEngine: QueryEngineService
  ) {}

  /**
   * 创建大屏
   */
  async createBigScreen(config: {
    name: string
    description?: string
    resolution: ScreenResolution
    customWidth?: number
    customHeight?: number
    layout: LayoutType
    theme?: string
    ownerId: string
  }): Promise<BigScreen> {
    // 解析分辨率
    let width: number
    let height: number

    if (config.resolution === 'custom') {
      width = config.customWidth || 1920
      height = config.customHeight || 1080
    } else {
      const [w, h] = config.resolution.split('x').map(Number)
      width = w
      height = h
    }

    const bigScreen = this.bigScreenRepo.create({
      name: config.name,
      description: config.description,
      width,
      height,
      layout: config.layout,
      theme: config.theme || 'dark',
      ownerId: config.ownerId,
      components: [],
      version: 1,
      isPublished: false
    })

    return this.bigScreenRepo.save(bigScreen)
  }

  /**
   * 添加大屏组件
   */
  async addComponent(
    screenId: string,
    component: {
      type: BigScreenComponentType
      name: string
      layout: {
        x: number
        y: number
        width: number
        height: number
        zIndex?: number
      }
      config: Record<string, unknown>
      dataSource?: DataSourceConfig
      animation?: AnimationConfig
      interaction?: InteractionConfig
    }
  ): Promise<void> {
    const screen = await this.bigScreenRepo.findOne({
      where: { id: screenId }
    })

    if (!screen) {
      throw new Error(`Big screen not found: ${screenId}`)
    }

    const newComponent: ScreenComponent = {
      id: `comp_${Date.now()}`,
      ...component,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    screen.components = [...screen.components, newComponent]
    screen.version += 1

    await this.bigScreenRepo.save(screen)
  }

  /**
   * 获取组件实时数据
   */
  async getComponentData(
    screenId: string,
    componentId: string,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    const screen = await this.bigScreenRepo.findOne({
      where: { id: screenId }
    })

    if (!screen) {
      throw new Error(`Big screen not found: ${screenId}`)
    }

    const component = screen.components.find(c => c.id === componentId)
    if (!component) {
      throw new Error(`Component not found: ${componentId}`)
    }

    if (!component.dataSource) {
      return null
    }

    // 执行数据源查询
    switch (component.dataSource.type) {
      case 'sql':
        return this.queryEngine.executeQuery({
          sql: component.dataSource.config.sql as string,
          parameters: { ...component.dataSource.config.parameters, ...params }
        })

      case 'api':
        // 调用外部 API 获取数据
        return this.fetchExternalApi(component.dataSource.config, params)

      case 'static':
        return component.dataSource.config.data

      case 'realtime':
        // 返回 WebSocket 连接信息
        return {
          type: 'websocket',
          url: component.dataSource.config.wsUrl,
          topic: component.dataSource.config.topic
        }

      default:
        return null
    }
  }

  /**
   * 发布大屏
   */
  async publishBigScreen(screenId: string, options?: {
    password?: string
    allowExport?: boolean
    expiryDate?: Date
  }): Promise<{ url: string; accessToken: string }> {
    const screen = await this.bigScreenRepo.findOne({
      where: { id: screenId }
    })

    if (!screen) {
      throw new Error(`Big screen not found: ${screenId}`)
    }

    // 生成访问令牌
    const accessToken = this.generateAccessToken()

    // 更新发布状态
    screen.isPublished = true
    screen.publishConfig = {
      accessToken,
      password: options?.password,
      allowExport: options?.allowExport ?? false,
      expiryDate: options?.expiryDate,
      publishedAt: new Date()
    }

    await this.bigScreenRepo.save(screen)

    // 返回访问链接
    const baseUrl = process.env.PUBLIC_URL || 'https://viz.m5platform.com'
    return {
      url: `${baseUrl}/s/${screenId}?token=${accessToken}`,
      accessToken
    }
  }

  /**
   * 获取大屏模板列表
   */
  getTemplates(): Array<{
    id: string
    name: string
    thumbnail: string
    category: string
    resolution: ScreenResolution
  }> {
    return [
      {
        id: 'enterprise-overview',
        name: '企业运营总览',
        thumbnail: '/templates/enterprise-overview.png',
        category: 'management',
        resolution: '3840x2160'
      },
      {
        id: 'sales-dashboard',
        name: '销售数据驾驶舱',
        thumbnail: '/templates/sales-dashboard.png',
        category: 'sales',
        resolution: '1920x1080'
      },
      {
        id: 'iot-monitoring',
        name: 'IoT 实时监控',
        thumbnail: '/templates/iot-monitoring.png',
        category: 'iot',
        resolution: '7680x4320'
      },
      {
        id: 'supply-chain',
        name: '供应链可视化',
        thumbnail: '/templates/supply-chain.png',
        category: 'logistics',
        resolution: '3840x2160'
      }
    ]
  }

  private async fetchExternalApi(
    config: Record<string, unknown>,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    // 实际实现需要调用外部 HTTP 服务
    this.logger.debug('Fetching external API:', config.endpoint)
    return null
  }

  private generateAccessToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
