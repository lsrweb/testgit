/**
 * 页面通信类 - 基于BroadcastChannel
 * 用于不同页面之间的通信
 */
class PageCommunicator {
  /**
   * @param {string} channelName - 通信频道名称
   */
  constructor(channelName = 'app_default_channel') {
    this.channelName = channelName;
    this.channel = null;
    this.handlers = new Map();
    this.isConnected = false;
    
    // 页面就绪状态跟踪
    this.readyPages = new Set();
    // 消息队列，按目标页面存储
    this.messageQueue = new Map();
    // 当前页面ID
    this.pageId = this.generatePageId();
    
    // 连接到频道
    this.connect();
    
    // 页面加载后发送就绪消息
    if (document.readyState === 'complete') {
      this.sendReadySignal();
    } else {
      window.addEventListener('load', () => this.sendReadySignal());
    }
    
    // 定期发送心跳，确认连接状态
    this.startHeartbeat();
  }

  /**
   * 生成唯一的页面ID
   * @returns {string}
   */
  generatePageId() {
    return `${window.location.pathname.replace(/\//g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * 发送页面就绪信号
   */
  sendReadySignal() {
    try {
      if (this.channel) {
        this.channel.postMessage({
          type: '__system__',
          action: 'page_ready',
          pageId: this.pageId,
          path: window.location.pathname,
          timestamp: Date.now()
        });
        console.log(`发送页面就绪信号: ${this.pageId}`);
      }
    } catch (error) {
      console.error('发送页面就绪信号失败:', error);
    }
  }
  
  /**
   * 开始心跳检测
   */
  startHeartbeat() {
    setInterval(() => {
      if (this.isConnected) {
        try {
          this.channel.postMessage({
            type: '__system__',
            action: 'heartbeat',
            pageId: this.pageId,
            timestamp: Date.now()
          });
        } catch (error) {
          console.warn('心跳发送失败，尝试重新连接', error);
          this.connect();
        }
      } else {
        this.connect();
      }
    }, 30000); // 每30秒发送一次心跳
  }

  /**
   * 连接到广播频道
   */
  connect() {
    if (this.isConnected) return;
    
    try {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = this.handleMessage.bind(this);
      this.channel.onmessageerror = this.handleError.bind(this);
      this.isConnected = true;
      console.log(`成功连接到频道: ${this.channelName}`);
      
      // 连接后立即发送就绪信号
      this.sendReadySignal();
    } catch (error) {
      console.error('创建BroadcastChannel失败:', error);
    }
  }

  /**
   * 处理接收到的消息
   * @param {MessageEvent} event 
   */
  handleMessage(event) {
    const message = event.data || {};
    
    // 处理系统消息
    if (message.type === '__system__') {
      this.handleSystemMessage(message);
      return;
    }
    
    const { type, data, timestamp, sender, targetPageId } = message;
    
    // 如果消息有指定目标且不是当前页面，则忽略
    if (targetPageId && targetPageId !== this.pageId) {
      return;
    }
    
    if (!type) return;
    
    if (this.handlers.has(type)) {
      this.handlers.get(type).forEach(handler => {
        try {
          handler(data, { timestamp, sender, pageId: message.pageId });
        } catch (error) {
          console.error(`处理消息类型 "${type}" 时出错:`, error);
        }
      });
    }
  }
  
  /**
   * 处理系统消息
   * @param {Object} message 
   */
  handleSystemMessage(message) {
    switch(message.action) {
      case 'page_ready':
        // 记录页面已就绪
        this.readyPages.add(message.pageId);
        console.log(`页面就绪: ${message.pageId}`);
        
        // 发送队列中给该页面的消息
        this.sendQueuedMessages(message.pageId);
        break;
        
      case 'heartbeat':
        // 更新页面活跃状态
        this.readyPages.add(message.pageId);
        break;
        
      case 'page_close':
        // 移除页面就绪状态
        this.readyPages.delete(message.pageId);
        // 清理该页面的消息队列
        this.messageQueue.delete(message.pageId);
        break;
    }
  }
  
  /**
   * 发送队列中的消息
   * @param {string} pageId 
   */
  sendQueuedMessages(pageId) {
    if (!this.messageQueue.has(pageId)) return;
    
    const messages = this.messageQueue.get(pageId);
    if (messages && messages.length > 0) {
      console.log(`发送队列中的 ${messages.length} 条消息到页面 ${pageId}`);
      
      messages.forEach(msg => {
        this.channel.postMessage(msg);
      });
      
      // 清空已发送的消息
      this.messageQueue.delete(pageId);
    }
  }

  /**
   * 处理错误
   * @param {Event} event 
   */
  handleError(event) {
    console.error('BroadcastChannel错误:', event);
  }

  /**
   * 发送消息
   * @param {string} type - 消息类型
   * @param {any} data - 消息数据
   * @param {string} [targetPageId] - 目标页面ID，可选
   * @returns {boolean} - 发送是否成功
   */
  send(type, data, targetPageId = null) {
    if (!this.isConnected) {
      this.connect();
    }
    
    if (!this.isConnected) {
      console.error('无法发送消息: 频道未连接');
      return false;
    }

    try {
      const message = {
        type,
        data,
        timestamp: Date.now(),
        sender: this.getPageIdentifier(),
        pageId: this.pageId
      };
      
      // 如果指定了目标页面
      if (targetPageId) {
        message.targetPageId = targetPageId;
        
        // 如果目标页面尚未就绪，将消息加入队列
        if (!this.readyPages.has(targetPageId)) {
          if (!this.messageQueue.has(targetPageId)) {
            this.messageQueue.set(targetPageId, []);
          }
          this.messageQueue.get(targetPageId).push(message);
          console.log(`目标页面 ${targetPageId} 尚未就绪，消息已加入队列`);
          return true;
        }
      }
      
      // 发送消息
      this.channel.postMessage(message);
      return true;
    } catch (error) {
      console.error('发送消息失败:', error);
      return false;
    }
  }

  /**
   * 广播消息到所有就绪页面
   * @param {string} type - 消息类型
   * @param {any} data - 消息数据
   * @returns {boolean} - 发送是否成功
   */
  broadcast(type, data) {
    return this.send(type, data); // 不指定targetPageId即为广播
  }

  /**
   * 获取页面标识符
   * @returns {string}
   */
  getPageIdentifier() {
    return `${window.location.pathname}${window.location.search}`;
  }

  /**
   * 订阅消息
   * @param {string} type - 消息类型
   * @param {Function} callback - 回调函数
   * @returns {Function} - 取消订阅的函数
   */
  subscribe(type, callback) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    
    this.handlers.get(type).push(callback);
    
    // 返回取消订阅的函数
    return () => this.unsubscribe(type, callback);
  }

  /**
   * 取消订阅
   * @param {string} type - 消息类型
   * @param {Function} callback - 回调函数
   */
  unsubscribe(type, callback) {
    if (!this.handlers.has(type)) return;
    
    const handlers = this.handlers.get(type);
    const index = handlers.indexOf(callback);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
    
    if (handlers.length === 0) {
      this.handlers.delete(type);
    }
  }

  /**
   * 关闭连接
   */
  close() {
    if (this.isConnected && this.channel) {
      // 发送页面关闭通知
      try {
        this.channel.postMessage({
          type: '__system__',
          action: 'page_close',
          pageId: this.pageId,
          timestamp: Date.now()
        });
      } catch (e) {
        console.warn('发送页面关闭通知失败', e);
      }
      
      // 关闭频道
      this.channel.close();
      this.isConnected = false;
      this.handlers.clear();
      console.log(`已关闭频道: ${this.channelName}`);
    }
  }

  /**
   * 打开页面，可控制是否仅打开一个实例
   * @param {string} url - 页面URL
   * @param {string} name - 窗口名称（用于单例控制）
   * @param {boolean} singleInstance - 是否只打开一个实例
   * @returns {Window} - 打开的窗口引用
   */
  static openPage(url, name = '', singleInstance = false) {
    if (singleInstance && name) {
      const existingWindow = window.open('', name);
      
      // 检查窗口是否已经打开且有效
      const isWindowValid = !existingWindow.closed && 
        existingWindow.location && 
        existingWindow.location.href !== 'about:blank';
      
      // 如果窗口已存在且有效，直接获取焦点
      if (isWindowValid) {
        try {
          existingWindow.focus();
          return existingWindow;
        } catch (e) {
          // 如果跨域错误，则回退到创建新窗口
          console.warn('无法访问现有窗口，将创建新窗口', e);
        }
      }
      
      // 打开新窗口并指定名称以便后续复用
      const newWindow = window.open(url, name);
      return newWindow;
    } else {
      // 始终打开新窗口
      return window.open(url, '_blank');
    }
  }
  
  /**
   * 检查特定名称的页面是否已打开
   * @param {string} name - 窗口名称
   * @returns {boolean} - 是否已打开
   */
  static isPageOpen(name) {
    if (!name) return false;
    
    const win = window.open('', name);
    const isOpen = win && !win.closed && 
      win.location && 
      win.location.href !== 'about:blank';
      
    // 不修改现有窗口
    if (win && !win.closed) {
      win.blur();
    }
    
    return isOpen;
  }

  /**
   * 等待页面就绪
   * @param {string} pageId - 目标页面ID
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<boolean>} - 是否就绪
   */
  waitForPageReady(pageId, timeout = 5000) {
    if (this.readyPages.has(pageId)) {
      return Promise.resolve(true);
    }
    
    return new Promise((resolve) => {
      const checkInterval = 100; // 检查间隔（毫秒）
      let elapsed = 0;
      
      const checkReady = () => {
        if (this.readyPages.has(pageId)) {
          resolve(true);
          return;
        }
        
        elapsed += checkInterval;
        if (elapsed >= timeout) {
          console.warn(`等待页面${pageId}就绪超时`);
          resolve(false);
          return;
        }
        
        setTimeout(checkReady, checkInterval);
      };
      
      checkReady();
    });
  }
}

// 单例模式实现
const instances = new Map();

/**
 * 获取PageCommunicator实例
 * @param {string} channelName - 通信频道名称
 * @returns {PageCommunicator}
 */
function getPageCommunicator(channelName = 'app_default_channel') {
  if (!instances.has(channelName)) {
    instances.set(channelName, new PageCommunicator(channelName));
  }
  return instances.get(channelName);
}

// 页面卸载时清理所有实例
window.addEventListener('beforeunload', function() {
  instances.forEach(instance => {
    try {
      instance.close();
    } catch (e) {
      console.warn('关闭通信实例失败', e);
    }
  });
});

// 暴露给全局，方便HTML页面直接使用
window.PageCommunicator = PageCommunicator;
window.getPageCommunicator = getPageCommunicator;
