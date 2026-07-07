/**
 * LowcodeService · 低代码聚合服务
 * 封装页面构建、模板管理、快照、组件库管理等能力
 */

import { Injectable } from '@nestjs/common'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'
import type { Page, Component } from './lowcode-audit.service'
import type { LowcodeTemplate, LowcodePageSnapshot, LowcodeComponentLibrary } from './lowcode.entity'

export interface DashboardStats {
  totalPages: number
  publishedPages: number
  draftPages: number
  totalTemplates: number
  totalComponents: number
  totalSnapshots: number
}

export interface PageExportData {
  templateId: string
  name: string
  components: Record<string, unknown>[]
  status: string
  version: number
}

@Injectable()
export class LowcodeService {
  private templates: Map<string, LowcodeTemplate> = new Map()
  private snapshots: LowcodePageSnapshot[] = []
  private componentLib: Map<string, LowcodeComponentLibrary> = new Map()
  private snapshotCounter = 0
  private templateCounter = 0
  private componentCounter = 0

  constructor(
    private readonly pageBuilder: LowCodePageBuilder,
    private readonly auditService: AuditAlertService,
  ) {}

  // ─── Template Management ──────────────────────

  registerTemplate(template: Omit<LowcodeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }): LowcodeTemplate {
    const id = `tpl-${Date.now()}-${++this.templateCounter}`
    const tpl: LowcodeTemplate = {
      id,
      name: template.name,
      description: template.description,
      components: template.components ?? [],
      status: (template.status as LowcodeTemplate['status']) ?? 'active',
      metadata: template.metadata ?? {},
      createdBy: template.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.templates.set(id, tpl)
    return tpl
  }

  getTemplate(id: string): LowcodeTemplate | undefined {
    return this.templates.get(id)
  }

  listTemplates(filter?: { status?: string }): LowcodeTemplate[] {
    let list = Array.from(this.templates.values())
    if (filter?.status) {
      list = list.filter((t) => t.status === filter.status)
    }
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  updateTemplate(id: string, data: Partial<Pick<LowcodeTemplate, 'name' | 'description' | 'components' | 'status'>>): LowcodeTemplate {
    const tpl = this.templates.get(id)
    if (!tpl) throw new Error(`Template not found: ${id}`)
    if (data.name !== undefined) tpl.name = data.name
    if (data.description !== undefined) tpl.description = data.description
    if (data.components !== undefined) tpl.components = data.components
    if (data.status !== undefined) tpl.status = data.status as LowcodeTemplate['status']
    tpl.updatedAt = new Date()
    return tpl
  }

  deleteTemplate(id: string): void {
    if (!this.templates.has(id)) throw new Error(`Template not found: ${id}`)
    this.templates.delete(id)
  }

  // ─── Snapshot Management ──────────────────────

  createSnapshot(pageId: string, changelog?: string, publishedBy?: string): LowcodePageSnapshot {
    const page = this.pageBuilder.getPage(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    this.snapshotCounter++
    const snapshot: LowcodePageSnapshot = {
      id: `snap-${Date.now()}`,
      pageId,
      version: this.snapshotCounter,
      components: page.components as unknown as Record<string, unknown>[],
      changelog,
      publishedBy,
      createdAt: new Date(),
    }
    this.snapshots.push(snapshot)
    return snapshot
  }

  listSnapshots(pageId: string): LowcodePageSnapshot[] {
    return this.snapshots
      .filter((s) => s.pageId === pageId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  getSnapshot(id: string): LowcodePageSnapshot | undefined {
    return this.snapshots.find((s) => s.id === id)
  }

  // ─── Component Library ────────────────────────

  registerComponent(comp: Omit<LowcodeComponentLibrary, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }): LowcodeComponentLibrary {
    const id = `lib-${Date.now()}-${++this.componentCounter}`
    const entry: LowcodeComponentLibrary = {
      id,
      name: comp.name,
      type: comp.type,
      defaultProps: comp.defaultProps ?? {},
      schema: comp.schema ?? {},
      status: (comp.status as LowcodeComponentLibrary['status']) ?? 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.componentLib.set(id, entry)
    return entry
  }

  listComponentLibrary(): LowcodeComponentLibrary[] {
    return Array.from(this.componentLib.values())
  }

  getComponent(id: string): LowcodeComponentLibrary | undefined {
    return this.componentLib.get(id)
  }

  // ─── Page Export / Import ─────────────────────

  exportPage(pageId: string): PageExportData {
    const page = this.pageBuilder.getPage(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    const snapshots = this.listSnapshots(pageId)
    return {
      templateId: page.templateId,
      name: page.name,
      components: page.components as unknown as Record<string, unknown>[],
      status: page.status,
      version: snapshots.length > 0 ? snapshots[0].version : 1,
    }
  }

  importPage(data: PageExportData, newName?: string): Page {
    const tpl = this.pageBuilder.getTemplate(data.templateId)
    if (!tpl) {
      // Auto-register missing template
      this.registerTemplate({
        name: `Imported-${data.templateId}`,
        description: 'Auto-registered from page import',
        components: [],
        createdBy: 'system',
      })
    }
    const page = this.pageBuilder.createPage(data.templateId, { name: newName ?? data.name })
    // Restore components from export
    for (const comp of data.components) {
      this.pageBuilder.addComponent(page.id, {
        type: comp.type as string,
        props: comp.props as Record<string, unknown>,
      })
    }
    return page
  }

  // ─── Dashboard ────────────────────────────────

  getDashboardStats(): DashboardStats {
    const pages = this.pageBuilder['pages'] as Map<string, Page> | undefined
    const pageList = pages ? Array.from(pages.values()) : []
    const publishedPages = pageList.filter((p) => p.status === 'published').length
    const draftPages = pageList.filter((p) => p.status === 'draft').length

    return {
      totalPages: pageList.length,
      publishedPages,
      draftPages,
      totalTemplates: this.templates.size,
      totalComponents: this.componentLib.size,
      totalSnapshots: this.snapshots.length,
    }
  }

  // ─── Page Builder Delegation ──────────────────

  getPageBuilder(): LowCodePageBuilder {
    return this.pageBuilder
  }

  getAuditService(): AuditAlertService {
    return this.auditService
  }
}
