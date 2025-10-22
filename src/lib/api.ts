import { supabase } from './supabase';
import { Task, Profile, PlayerGameAuth, GamePlatform, CSRApplication, Notification as AppNotification } from './types';

// 任务相关API
export const taskService = {
  // 获取用户任务
  async getUserTasks(userId: string): Promise<Task[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`claimed_by.eq.${userId},assigned_to.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }
  },

  // 获取开放任务
  async getOpenTasks(): Promise<Task[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'open')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching open tasks:', error);
      return [];
    }
  },

  // 抢单
  async claimTask(taskId: string, userId: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'claimed',
          claimed_by: userId,
          claimed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('status', 'open');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error claiming task:', error);
      return false;
    }
  },

  // 创建任务
  async createTask(task: Partial<Task>): Promise<Task | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  },

  // 更新任务状态
  async updateTaskStatus(taskId: string, status: Task['status'], updates: Partial<Task> = {}): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...updates
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  }
};

// 用户相关API
export const userService = {
  // 获取用户资料
  async getProfile(userId: string): Promise<Profile | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  // 更新用户资料
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  },

  // 获取所有用户（管理员功能）
  async getAllUsers(): Promise<Profile[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }
};

// 游戏认证相关API
export const gameAuthService = {
  // 获取游戏平台列表
  async getGamePlatforms(): Promise<GamePlatform[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('game_platforms')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching game platforms:', error);
      return [];
    }
  },

  // 提交游戏认证
  async submitGameAuth(auth: Partial<PlayerGameAuth>): Promise<PlayerGameAuth | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('player_game_auths')
        .insert([auth])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error submitting game auth:', error);
      return null;
    }
  },

  // 获取用户游戏认证
  async getUserGameAuths(userId: string): Promise<PlayerGameAuth[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('player_game_auths')
        .select(`
          *,
          game_platforms (
            name,
            display_name,
            icon_url
          )
        `)
        .eq('player_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user game auths:', error);
      return [];
    }
  },

  // 审核游戏认证
  async reviewGameAuth(authId: string, status: 'approved' | 'rejected', reviewerId: string, notes?: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from('player_game_auths')
        .update({
          status,
          verified_by: reviewerId,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', authId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error reviewing game auth:', error);
      return false;
    }
  }
};

// 客服申请相关API
export const csrService = {
  // 提交客服申请
  async submitApplication(application: Partial<CSRApplication>): Promise<CSRApplication | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('csr_applications')
        .insert([application])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error submitting application:', error);
      return null;
    }
  },

  // 获取所有申请（管理员功能）
  async getAllApplications(): Promise<CSRApplication[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('csr_applications')
        .select(`
          *,
          profiles!applicant_id (
            username,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching applications:', error);
      return [];
    }
  },

  // 审核申请
  async reviewApplication(applicationId: string, status: 'approved' | 'rejected', reviewerId: string, notes?: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from('csr_applications')
        .update({
          status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', applicationId);

      if (error) throw error;

      // 如果批准，更新用户角色
      if (status === 'approved') {
        const { data: application } = await supabase
          .from('csr_applications')
          .select('applicant_id')
          .eq('id', applicationId)
          .single();

        if (application) {
          await userService.updateProfile(application.applicant_id, { role: 'csr' });
        }
      }
      return true;
    } catch (error) {
      console.error('Error reviewing application:', error);
      return false;
    }
  }
};

// 通知相关API
export const notificationService = {
  // 获取用户通知
  async getUserNotifications(userId: string): Promise<AppNotification[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // 标记通知为已读
  async markAsRead(notificationId: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  // 创建通知
  async createNotification(notification: Partial<AppNotification>): Promise<AppNotification | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  },

  // 标记所有通知为已读
  async markAllAsRead(userId: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },

  // 删除通知
  async deleteNotification(notificationId: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
};