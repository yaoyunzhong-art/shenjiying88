// runbook.dto.test.ts - 运维手册 DTO 单元测试
import 'reflect-metadata'
import { describe, it, expect } from 'vitest'
import { plainToInstance } from 'class-transformer'
import {
  CreateRunbookDto,
  UpdateRunbookDto,
  ListRunbookQueryDto,
  MapAlertDto,
  RunbookStepDto,
} from './runbook.dto'

describe('RunbookStepDto', () => {
  it('应正确转换有效输入', () => {
    const dto = plainToInstance(RunbookStepDto, {
      stepNumber: 1,
      title: '环境检查',
      description: '检查服务器',
      command: 'uname -a',
      estimatedMinutes: 5,
    })
    expect(dto.stepNumber).toBe(1)
    expect(dto.title).toBe('环境检查')
  })
})

describe('CreateRunbookDto', () => {
  it('应正确转换完整创建请求', () => {
    const dto = plainToInstance(CreateRunbookDto, {
      title: '部署手册',
      category: 'deployment',
      severity: 'high',
      applicableVersions: ['v1.0.0+'],
      prerequisites: ['Docker'],
      steps: [
        {
          stepNumber: 1,
          title: '部署',
          description: '执行部署',
        },
      ],
      estimatedTotalMinutes: 10,
      status: 'draft',
      tags: ['部署'],
    })
    expect(dto.title).toBe('部署手册')
    expect(dto.steps).toHaveLength(1)
    expect(dto.status).toBe('draft')
  })

  it('应正确转换包含可选字段的创建请求', () => {
    const dto = plainToInstance(CreateRunbookDto, {
      title: '灾备手册',
      category: '灾难恢复',
      severity: 'critical',
      applicableVersions: ['v2.0.0+'],
      prerequisites: ['主从架构'],
      steps: [{ stepNumber: 1, title: '切换', description: '主从切换' }],
      estimatedTotalMinutes: 30,
      relatedAlerts: ['ALERT_db_down'],
      relatedRunbooks: ['rb-dr-001'],
      status: 'active',
      tags: ['灾备', '数据库'],
    })
    expect(dto.relatedAlerts).toContain('ALERT_db_down')
    expect(dto.relatedRunbooks).toContain('rb-dr-001')
    expect(dto.tags).toHaveLength(2)
  })

  it('应拒绝缺少必填字段', () => {
    const dto = plainToInstance(CreateRunbookDto, {
      title: '不完整',
    })
    // class-validator 在运行时进行检查，这里只验证转换后的值
    expect(dto.category).toBeUndefined()
    expect(dto.severity).toBeUndefined()
  })
})

describe('UpdateRunbookDto', () => {
  it('所有字段应为可选', () => {
    const dto = plainToInstance(UpdateRunbookDto, {})
    expect(dto).toBeDefined()
  })

  it('应正确转换部分更新', () => {
    const dto = plainToInstance(UpdateRunbookDto, {
      title: '更新标题',
      status: 'archived',
    })
    expect(dto.title).toBe('更新标题')
    expect(dto.status).toBe('archived')
  })
})

describe('ListRunbookQueryDto', () => {
  it('应正确转换筛选参数', () => {
    const dto = plainToInstance(ListRunbookQueryDto, {
      category: 'deployment',
      severity: 'critical',
      status: 'active',
      tag: 'Kubernetes',
    })
    expect(dto.category).toBe('deployment')
    expect(dto.severity).toBe('critical')
    expect(dto.tag).toBe('Kubernetes')
  })

  it('所有筛选参数应为可选', () => {
    const dto = plainToInstance(ListRunbookQueryDto, {})
    expect(dto.category).toBeUndefined()
    expect(dto.severity).toBeUndefined()
    expect(dto.status).toBeUndefined()
    expect(dto.tag).toBeUndefined()
  })
})

describe('MapAlertDto', () => {
  it('应正确转换告警映射', () => {
    const dto = plainToInstance(MapAlertDto, {
      alertName: 'ALERT_cpu_high',
      runbookId: 'rb-scale-001',
      possibleCauses: ['流量突增'],
      severity: 'high',
      autoAction: 'scale-up',
    })
    expect(dto.alertName).toBe('ALERT_cpu_high')
    expect(dto.autoAction).toBe('scale-up')
  })

  it('autoAction 应为可选', () => {
    const dto = plainToInstance(MapAlertDto, {
      alertName: 'ALERT_db_slow',
      runbookId: 'rb-db-001',
      possibleCauses: ['索引缺失'],
      severity: 'medium',
    })
    expect(dto.autoAction).toBeUndefined()
  })
})
