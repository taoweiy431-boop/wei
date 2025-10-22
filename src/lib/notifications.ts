import { supabase } from './supabase';
import { Notification as AppNotification, DispatchReminder } from './types';

// 通知服务
export const notificationService = {
  // 获取用户通知
  async getUserNotifications(userId: string, limit = 20) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase!
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as AppNotification[];
  },

  // 标记通知为已读
  async markAsRead(notificationId: string) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase!
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // 标记所有通知为已读
  async markAllAsRead(userId: string) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase!
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  // 删除通知
  async deleteNotification(notificationId: string) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase!
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  // 获取未读通知数量
  async getUnreadCount(userId: string) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { count, error } = await supabase!
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // 创建通知
  async createNotification(notification: Omit<AppNotification, 'id' | 'created_at'>) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase!
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data as AppNotification;
  }
};

// 派单提醒服务
export const dispatchReminderService = {
  // 获取用户的派单提醒
  async getUserReminders(userId: string) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase!
      .from('dispatch_reminders')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // 创建派单提醒
  async createReminder(reminder: Omit<DispatchReminder, 'id' | 'created_at'>) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase!
      .from('dispatch_reminders')
      .insert(reminder)
      .select()
      .single();

    if (error) throw error;
    return data as DispatchReminder;
  },

  // 更新提醒状态
  async updateReminderStatus(reminderId: string, status: 'pending' | 'sent' | 'acknowledged' | 'expired') {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase!
      .from('dispatch_reminders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', reminderId);

    if (error) throw error;
  },

  // 获取待发送的提醒
  async getPendingReminders() {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase!
      .from('dispatch_reminders')
      .select(`
        *,
        task:tasks(*),
        user:profiles(*)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;
    return data;
  }
};

// 实时通知管理器
export class NotificationManager {
  private static instance: NotificationManager;
  private audioContext: AudioContext | null = null;
  private notificationSound: AudioBuffer | null = null;
  private subscribers: Set<(notification: AppNotification) => void> = new Set();

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // 初始化音频上下文
  async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建简单的提示音
      const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(2 * Math.PI * 800 * i / this.audioContext.sampleRate) * 0.3;
      }
      
      this.notificationSound = buffer;
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  }

  // 播放通知声音
  playNotificationSound() {
    if (this.audioContext && this.notificationSound) {
      try {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.notificationSound;
        source.connect(this.audioContext.destination);
        source.start();
      } catch (error) {
        console.warn('Failed to play notification sound:', error);
      }
    }
  }

  // 显示浏览器通知
  async showBrowserNotification(title: string, body: string, icon?: string) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          tag: 'delta-club-notification'
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: icon || '/favicon.ico',
            tag: 'delta-club-notification'
          });
        }
      }
    }
  }

  // 订阅通知
  subscribe(callback: (notification: AppNotification) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // 发送通知给订阅者
  notify(notification: AppNotification) {
    this.subscribers.forEach(callback => callback(notification));
  }

  // 处理新任务派单
  async handleTaskDispatch(taskId: string, userId: string) {
    // 播放声音
    this.playNotificationSound();

    // 创建通知记录
    const notification = await notificationService.createNotification({
      user_id: userId,
      type: 'info',
      title: '新任务派单',
      content: '您有一个新的任务派单，请及时查看！',
      is_read: false
    });

    // 显示浏览器通知
    await this.showBrowserNotification(
      '新任务派单',
      '您有一个新的任务派单，请及时查看！'
    );

    // 通知订阅者
    this.notify(notification);

    return notification;
  }
}

// WebSocket 连接管理
export class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private notificationManager: NotificationManager;

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  constructor() {
    this.notificationManager = NotificationManager.getInstance();
  }

  // 连接WebSocket
  connect(userId: string) {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      // 这里使用Supabase的实时功能替代WebSocket
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const notification = payload.new as AppNotification;
            this.handleNotification(notification);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'dispatch_reminders',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const reminder = payload.new as DispatchReminder;
            this.handleDispatchReminder(reminder);
          }
        )
        .subscribe();

      console.log('Connected to real-time notifications');
      return channel;
    } catch (error) {
      console.error('Failed to connect to notifications:', error);
    }
  }

  // 处理通知
  private handleNotification(notification: AppNotification) {
    this.notificationManager.notify(notification);
    
    if (notification.type === 'info') {
      this.notificationManager.playNotificationSound();
      this.notificationManager.showBrowserNotification(
        notification.title,
        notification.content
      );
    }
  }

  // 处理派单提醒
  private handleDispatchReminder(reminder: DispatchReminder) {
    this.notificationManager.playNotificationSound();
    this.notificationManager.showBrowserNotification(
      '任务提醒',
      '您有一个任务需要处理，请及时查看！'
    );
  }
}

// 导出单例实例
export const notificationManager = NotificationManager.getInstance();
export const webSocketManager = WebSocketManager.getInstance();