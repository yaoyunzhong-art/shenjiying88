/**
 * 模拟API服务
 * Mock API Service for Development
 */

class MockAPIService {
  constructor() {
    this.latency = 100; // 模拟网络延迟
    this.errorRate = 0.05; // 5%错误率
    this.db = this.initializeDatabase();
  }

  // 初始化模拟数据库
  initializeDatabase() {
    return {
      metrics: this.generateInitialMetrics(),
      logs: this.generateInitialLogs(100),
      users: this.generateInitialUsers(50),
      alerts: this.generateInitialAlerts(20),
      performance: this.generatePerformanceHistory()
    };
  }

  // 生成初始指标数据
  generateInitialMetrics() {
    return {
      cpu: {
        usage: 45.2,
        cores: 8,
        temperature: 62,
        history: Array(60).fill(0).map(() => 30 + Math.random() * 40)
      },
      memory: {
        used: 12.4,
        total: 32,
        usage: 38.8,
        history: Array(60).fill(0).map(() => 30 + Math.random() * 20)
      },
      disk: {
        used: 456,
        total: 1024,
        usage: 44.5,
        read: 125.5,
        write: 89.2
      },
      network: {
        download: 45.2,
        upload: 12.8,
        connections: 2341,
        packets: 45678
      }
    };
  }

  // 生成初始日志
  generateInitialLogs(count) {
    const levels = ['error', 'warning', 'info', 'debug'];
    const services = ['api', 'database', 'auth', 'gateway', 'worker', 'scheduler'];
    const messages = {
      error: [
        'Database connection timeout',
        'Failed to process request',
        'Authentication failed',
        'Service unreachable',
        'Memory limit exceeded'
      ],
      warning: [
        'High response time detected',
        'Retry attempt failed',
        'Rate limit approaching',
        'Cache miss rate high'
      ],
      info: [
        'Service started successfully',
        'Configuration updated',
        'Backup completed',
        'User login successful'
      ],
      debug: [
        'Request processing started',
        'Cache invalidated',
        'Connection pool status',
        'Metrics collected'
      ]
    };

    return Array(count).fill(0).map((_, i) => {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const messageList = messages[level];
      const message = messageList[Math.floor(Math.random() * messageList.length)];
      
      return {
        id: `log-${Date.now()}-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        level,
        service,
        message,
        trace_id: `trace-${Math.random().toString(36).substr(2, 9)}`,
        user_id: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 1000)}` : null,
        metadata: {
          ip: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
          user_agent: 'Mozilla/5.0...',
          duration: Math.floor(Math.random() * 1000)
        }
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // 生成初始用户数据
  generateInitialUsers(count) {
    const roles = ['admin', 'developer', 'viewer', 'operator'];
    const departments = ['Engineering', 'Operations', 'DevOps', 'QA', 'Security'];
    
    return Array(count).fill(0).map((_, i) => ({
      id: `user-${i + 1}`,
      username: `user${i + 1}`,
      email: `user${i + 1}@company.com`,
      full_name: `User ${i + 1}`,
      role: roles[Math.floor(Math.random() * roles.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      last_login: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      login_count: Math.floor(Math.random() * 1000),
      actions: {
        views: Math.floor(Math.random() * 10000),
        edits: Math.floor(Math.random() * 1000),
        exports: Math.floor(Math.random() * 100)
      }
    }));
  }

  // 生成初始告警
  generateInitialAlerts(count) {
    const severities = ['critical', 'warning', 'info'];
    const categories = ['performance', 'availability', 'security', 'capacity'];
    const sources = ['cpu_monitor', 'memory_monitor', 'disk_monitor', 'network_monitor', 'health_check'];
    
    return Array(count).fill(0).map((_, i) => ({
      id: `alert-${Date.now()}-${i}`,
      severity: severities[Math.floor(Math.random() * severities.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      title: `Alert ${i + 1}`,
      message: `This is alert message ${i + 1}`,
      status: Math.random() > 0.3 ? 'open' : 'resolved',
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_at: Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
      assigned_to: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 10)}` : null
    }));
  }

  // 生成性能历史数据
  generatePerformanceHistory() {
    const points = 24 * 60; // 24小时，每分钟一个点
    const now = Date.now();
    
    return {
      cpu: Array(points).fill(0).map((_, i) => ({
        timestamp: now - (points - i) * 60 * 1000,
        value: 20 + Math.random() * 60 + Math.sin(i / 60) * 10
      })),
      memory: Array(points).fill(0).map((_, i) => ({
        timestamp: now - (points - i) * 60 * 1000,
        value: 30 + Math.random() * 30 + Math.cos(i / 120) * 5
      })),
      requests: Array(points).fill(0).map((_, i) => ({
        timestamp: now - (points - i) * 60 * 1000,
        value: Math.floor(100 + Math.random() * 200 + Math.sin(i / 30) * 50)
      })),
      latency: Array(points).fill(0).map((_, i) => ({
        timestamp: now - (points - i) * 60 * 1000,
        value: 20 + Math.random() * 80 + Math.cos(i / 45) * 20
      }))
    };
  }

  // 模拟API延迟
  async delay(ms = this.latency) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 模拟随机错误
  shouldError() {
    return Math.random() < this.errorRate;
  }

  // API响应包装
  createResponse(data, error = null) {
    return {
      success: !error,
      data: error ? null : data,
      error: error,
      timestamp: new Date().toISOString()
    };
  }

  // ==================== API 方法 ====================

  // 获取仪表盘数据
  async getDashboardData() {
    await this.delay(300);
    if (this.shouldError()) throw new Error('Failed to fetch dashboard data');
    
    return this.createResponse({
      metrics: this.db.metrics,
      summary: {
        totalRequests: Math.floor(1234567 + Math.random() * 1000),
        avgResponseTime: 45 + Math.random() * 10,
        errorRate: (Math.random() * 0.5).toFixed(2),
        uptime: 99.99
      },
      alerts: this.db.alerts.filter(a => a.status === 'open').slice(0, 5),
      recentLogs: this.db.logs.slice(0, 10)
    });
  }

  // 获取系统指标
  async getSystemMetrics(timeRange = '1h') {
    await this.delay(200);
    
    const ranges = {
      '1h': 60,
      '6h': 360,
      '24h': 1440,
      '7d': 10080
    };
    
    const points = ranges[timeRange] || 60;
    const now = Date.now();
    
    return this.createResponse({
      cpu: {
        current: 45.2 + Math.random() * 10,
        history: Array(points).fill(0).map((_, i) => ({
          timestamp: now - (points - i) * (timeRange === '7d' ? 60000 : 1000),
          value: 20 + Math.random() * 60
        }))
      },
      memory: {
        current: 38.8 + Math.random() * 5,
        history: Array(points).fill(0).map((_, i) => ({
          timestamp: now - (points - i) * (timeRange === '7d' ? 60000 : 1000),
          value: 30 + Math.random() * 20
        }))
      },
      disk: {
        usage: 44.5,
        read: 125.5 + Math.random() * 20,
        write: 89.2 + Math.random() * 15
      },
      network: {
        download: 45.2 + Math.random() * 10,
        upload: 12.8 + Math.random() * 5,
        connections: 2341 + Math.floor(Math.random() * 100)
      }
    });
  }

  // 获取日志
  async getLogs(filters = {}, page = 1, limit = 20) {
    await this.delay(300);
    
    let logs = [...this.db.logs];
    
    // 应用过滤器
    if (filters.level) {
      logs = logs.filter(l => l.level === filters.level);
    }
    if (filters.service) {
      logs = logs.filter(l => l.service === filters.service);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      logs = logs.filter(l => 
        l.message.toLowerCase().includes(search) ||
        l.service.toLowerCase().includes(search)
      );
    }
    if (filters.startDate) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.endDate));
    }
    
    const total = logs.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedLogs = logs.slice(start, start + limit);
    
    return this.createResponse({
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary: {
        total: this.db.logs.length,
        error: this.db.logs.filter(l => l.level === 'error').length,
        warning: this.db.logs.filter(l => l.level === 'warning').length,
        info: this.db.logs.filter(l => l.level === 'info').length
      }
    });
  }

  // 获取用户分析数据
  async getUserAnalytics(timeRange = '24h') {
    await this.delay(400);
    
    const now = Date.now();
    const ranges = {
      '1h': { points: 60, interval: 60000 },
      '24h': { points: 24, interval: 3600000 },
      '7d': { points: 7, interval: 86400000 },
      '30d': { points: 30, interval: 86400000 }
    };
    
    const config = ranges[timeRange] || ranges['24h'];
    
    return this.createResponse({
      overview: {
        totalUsers: 45678 + Math.floor(Math.random() * 1000),
        activeUsers: 12345 + Math.floor(Math.random() * 500),
        newUsers: 567 + Math.floor(Math.random() * 100),
        returningUsers: 8901 + Math.floor(Math.random() * 200)
      },
      
      activity: Array(config.points).fill(0).map((_, i) => ({
        timestamp: now - (config.points - i) * config.interval,
        activeUsers: Math.floor(8000 + Math.random() * 4000),
        sessions: Math.floor(12000 + Math.random() * 6000),
        pageViews: Math.floor(45000 + Math.random() * 15000)
      })),
      
      devices: [
        { name: 'Desktop', value: 45 + Math.random() * 5, color: '#00d4ff' },
        { name: 'Mobile', value: 40 + Math.random() * 5, color: '#7000ff' },
        { name: 'Tablet', value: 10 + Math.random() * 3, color: '#00ff88' },
        { name: 'Other', value: 5 + Math.random() * 2, color: '#ffaa00' }
      ],
      
      browsers: [
        { name: 'Chrome', value: 55 + Math.random() * 5 },
        { name: 'Firefox', value: 15 + Math.random() * 3 },
        { name: 'Safari', value: 20 + Math.random() * 3 },
        { name: 'Edge', value: 8 + Math.random() * 2 },
        { name: 'Other', value: 2 + Math.random() * 1 }
      ],
      
      geo: [
        { country: 'China', users: 25000 + Math.floor(Math.random() * 2000), percentage: 54.8 },
        { country: 'USA', users: 8500 + Math.floor(Math.random() * 1000), percentage: 18.6 },
        { country: 'Japan', users: 4200 + Math.floor(Math.random() * 500), percentage: 9.2 },
        { country: 'Germany', users: 2800 + Math.floor(Math.random() * 300), percentage: 6.1 },
        { country: 'UK', users: 2100 + Math.floor(Math.random() * 200), percentage: 4.6 },
        { country: 'Others', users: 3100 + Math.floor(Math.random() * 300), percentage: 6.6 }
      ],
      
      topPages: [
        { path: '/', views: 125000, avgTime: 145 },
        { path: '/dashboard', views: 89000, avgTime: 320 },
        { path: '/analytics', views: 67000, avgTime: 280 },
        { path: '/settings', views: 45000, avgTime: 180 },
        { path: '/profile', views: 38000, avgTime: 95 }
      ]
    });
  }

  // 获取告警
  async getAlerts(filters = {}, page = 1, limit = 20) {
    await this.delay(250);
    
    let alerts = [...this.db.alerts];
    
    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    if (filters.status) {
      alerts = alerts.filter(a => a.status === filters.status);
    }
    if (filters.category) {
      alerts = alerts.filter(a => a.category === filters.category);
    }
    
    const total = alerts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    
    return this.createResponse({
      alerts: alerts.slice(start, start + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      summary: {
        total: this.db.alerts.length,
        critical: this.db.alerts.filter(a => a.severity === 'critical' && a.status === 'open').length,
        warning: this.db.alerts.filter(a => a.severity === 'warning' && a.status === 'open').length,
        resolved: this.db.alerts.filter(a => a.status === 'resolved').length
      }
    });
  }

  // 实时数据流
  subscribeRealtime(callback) {
    const interval = setInterval(() => {
      const update = this.generateRealtimeUpdate();
      callback(update);
    }, AppConfig.refreshInterval);
    
    AppState.refreshTimers.push(interval);
    return () => clearInterval(interval);
  }

  // 生成实时更新数据
  generateRealtimeUpdate() {
    const now = Date.now();
    
    return {
      timestamp: now,
      metrics: {
        cpu: {
          usage: 30 + Math.random() * 50,
          temperature: 50 + Math.random() * 30
        },
        memory: {
          usage: 35 + Math.random() * 15
        },
        requests: {
          total: Math.floor(1000 + Math.random() * 500),
          success: Math.floor(950 + Math.random() * 45),
          error: Math.floor(Math.random() * 10)
        },
        latency: {
          avg: 30 + Math.random() * 50,
          p95: 80 + Math.random() * 40,
          p99: 150 + Math.random() * 50
        }
      }
    };
  }

  // 辅助方法：创建响应
  createResponse(data, error = null) {
    return {
      success: !error,
      data: error ? null : data,
      error: error,
      timestamp: new Date().toISOString()
    };
  }
}

// 创建全局实例
window.MockAPI = new MockAPIService();
