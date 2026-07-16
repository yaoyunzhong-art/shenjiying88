import { Injectable, Logger } from '@nestjs/common';

export interface ModuleRecord {
  id: string;
  name: string;
  version: string;
  dependencies: string[];
  status: 'enabled' | 'disabled' | 'error';
  loadedAt: string;
}

@Injectable()
export class ModulesService {
  private readonly logger = new Logger(ModulesService.name);
  private modules = new Map<string, ModuleRecord>();

  /** 注册模块 */
  register(id: string, name: string, version: string, dependencies: string[] = []): ModuleRecord {
    const record: ModuleRecord = {
      id, name, version, dependencies,
      status: 'enabled',
      loadedAt: new Date().toISOString(),
    };
    this.modules.set(id, record);
    this.logger.log(`模块注册: ${name} v${version}`);
    return record;
  }

  /** 获取所有模块 */
  getAll(): ModuleRecord[] {
    return Array.from(this.modules.values());
  }

  /** 按ID获取 */
  getById(id: string): ModuleRecord | null {
    return this.modules.get(id) ?? null;
  }

  /** 拓扑排序（依赖顺序） */
  getTopologicalSort(): ModuleRecord[] {
    const sorted: ModuleRecord[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string): void => {
      if (visited.has(id)) return;
      if (visiting.has(id)) return; // 循环依赖，跳过
      visiting.add(id);
      const mod = this.modules.get(id);
      if (mod) {
        for (const dep of mod.dependencies) {
          visit(dep);
        }
        sorted.push(mod);
        visited.add(id);
      }
      visiting.delete(id);
    };

    for (const id of this.modules.keys()) {
      visit(id);
    }
    return sorted;
  }

  /** 获取循环依赖 */
  detectCycles(): string[][] {
    const cycles: string[][] = [];
    const allNodes = Array.from(this.modules.keys());

    for (const start of allNodes) {
      const path: string[] = [];
      const visited = new Set<string>();

      const dfs = (node: string): boolean => {
        if (path.includes(node)) {
          const cycleStart = path.indexOf(node);
          cycles.push([...path.slice(cycleStart), node]);
          return true;
        }
        if (visited.has(node)) return false;
        visited.add(node);
        path.push(node);
        const mod = this.modules.get(node);
        if (mod) {
          for (const dep of mod.dependencies) {
            if (dfs(dep)) return true;
          }
        }
        path.pop();
        return false;
      };

      dfs(start);
    }
    return cycles;
  }

  /** 检查依赖是否全部注册 */
  checkDependencies(id: string): { resolved: string[]; missing: string[] } {
    const mod = this.modules.get(id);
    if (!mod) return { resolved: [], missing: [] };
    const resolved: string[] = [];
    const missing: string[] = [];
    for (const dep of mod.dependencies) {
      if (this.modules.has(dep)) {
        resolved.push(dep);
      } else {
        missing.push(dep);
      }
    }
    return { resolved, missing };
  }

  /** 切换模块状态 */
  toggleStatus(id: string): ModuleRecord | null {
    const mod = this.modules.get(id);
    if (!mod) return null;
    mod.status = mod.status === 'enabled' ? 'disabled' : 'enabled';
    return mod;
  }
}
