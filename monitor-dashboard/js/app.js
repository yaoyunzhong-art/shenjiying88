/**
 * 企业级监控平台 - 核心应用
 * Enterprise Monitoring Platform - Core Application
 */

// 应用配置
const AppConfig = {
  version: '2.0.0',
  name: 'Monitor Pro',
  apiBase: '/api/v1',
  refreshInterval: 5000,
  theme: localStorage.getItem('theme') || 'dark',
  wsEnabled: true,
  wsUrl: 'ws://localhost:8080/ws'
};

// 状态管理
const AppState = {
  currentPage: 'dashboard',
  user: null,
  isAuthenticated: false,
  notifications: [],
  realtimeData: {},
  charts: {},
  wsConnection: null,
  refreshTimers: []
};

// 工具函数
const Utils = {
  // 格式化数字
  formatNumber(num, decimals = 0) {
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  },

  // 格式化字节
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 格式化时间
  formatDuration(ms) {
    if (ms < 1000) return ms + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    if (ms < 3600000) return Math.floor(ms / 60000) + 'm';
    return Math.floor(ms / 3600000) + 'h';
  },

  // 格式化日期时间
  formatDateTime(date, format = 'full') {
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');
    
    if (format === 'time') {
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    if (format === 'date') {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // 防抖
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // 深拷贝
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }
  },

  // 随机颜色生成
  randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
  },

  // 颜色插值
  interpolateColor(color1, color2, factor) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
};

// 通知管理
const NotificationManager = {
  container: null,
  
  init() {
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
  },
  
  show({ type = 'info', title, message, duration = 5000 }) {
    const id = Utils.generateId();
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.id = id;
    
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
    
    notification.innerHTML = `
      <div class="notification-icon">${icons[type]}</div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">×</button>
    `;
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.dismiss(id);
    });
    
    this.container.appendChild(notification);
    
    // 动画进入
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    // 自动关闭
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    
    return id;
  },
  
  dismiss(id) {
    const notification = document.getElementById(id);
    if (notification) {
      notification.classList.remove('show');
      notification.classList.add('hide');
      setTimeout(() => notification.remove(), 300);
    }
  },
  
  success(title, message) {
    return this.show({ type: 'success', title, message });
  },
  
  error(title, message) {
    return this.show({ type: 'error', title, message });
  },
  
  warning(title, message) {
    return this.show({ type: 'warning', title, message });
  },
  
  info(title, message) {
    return this.show({ type: 'info', title, message });
  }
};

// 导出模块
window.MonitorApp = {
  config: AppConfig,
  state: AppState,
  utils: Utils,
  notify: NotificationManager
};
