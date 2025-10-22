import { isSupabaseConfigured, getSupabaseClient } from './supabase';
import type { GamePlatform, PlayerGameAuth, PlayerGameInfo } from './types';

// 游戏平台管理
export const gamePlatformService = {
  // 获取所有游戏平台
  async getAll(): Promise<GamePlatform[]> {
    if (!isSupabaseConfigured) return [];
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('game_platforms')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching game platforms:', error);
      return [];
    }
  },

  // 获取单个游戏平台
  async getById(id: string): Promise<GamePlatform | null> {
    if (!isSupabaseConfigured) return null;
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('game_platforms')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching game platform:', error);
      return null;
    }
  },

  // 创建游戏平台（仅管理员）
  async create(platform: Omit<GamePlatform, 'id' | 'created_at' | 'updated_at'>): Promise<GamePlatform | null> {
    if (!isSupabaseConfigured) return null;
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('game_platforms')
        .insert(platform)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating game platform:', error);
      return null;
    }
  },

  // 更新游戏平台（仅管理员）
  async update(id: string, updates: Partial<GamePlatform>): Promise<GamePlatform | null> {
    if (!isSupabaseConfigured) return null;
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('game_platforms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating game platform:', error);
      return null;
    }
  }
};

// 打手游戏认证管理
export const playerGameAuthService = {
  // 获取当前用户的游戏认证
  async getMyAuth(): Promise<PlayerGameAuth[]> {
    if (!isSupabaseConfigured) return [];
    
    try {
      const client = getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return [];

      const { data, error } = await client
        .from('player_game_auth')
        .select(`
          *,
          game_platforms (
            display_name,
            icon_url
          )
        `)
        .eq('player_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user auth:', error);
      return [];
    }
  },

  // 提交游戏认证申请
  async submitAuth(authData: {
    platform_id: string;
    game_uid: string;
    character_name: string;
    server_region?: string;
    rank_level?: string;
    verification_screenshot?: string;
  }): Promise<PlayerGameAuth | null> {
    if (!isSupabaseConfigured) return null;
    
    try {
      const client = getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return null;

      const { data, error } = await client
        .from('player_game_auth')
        .insert({
          ...authData,
          player_id: user.id,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error submitting auth:', error);
      return null;
    }
  },

  // 更新游戏认证信息
  async updateAuth(id: string, updates: Partial<PlayerGameAuth>): Promise<PlayerGameAuth | null> {
    if (!isSupabaseConfigured) return null;
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('player_game_auth')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating auth:', error);
      return null;
    }
  },

  // 删除游戏认证
  async deleteAuth(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('player_game_auth')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting auth:', error);
      return false;
    }
  },

  // 获取待审核的认证申请（管理员/客服）
  async getPendingAuth(): Promise<PlayerGameAuth[]> {
    if (!isSupabaseConfigured) return [];
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('player_game_auth')
        .select(`
          *,
          profiles (
            username
          ),
          game_platforms (
            display_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending auth:', error);
      return [];
    }
  },

  // 审核游戏认证（管理员/客服）
  async reviewAuth(id: string, status: 'approved' | 'rejected', notes?: string): Promise<PlayerGameAuth | null> {
    if (!isSupabaseConfigured) return null;
    
    try {
      const client = getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return null;

      const { data, error } = await client
        .from('player_game_auth')
        .update({
          status,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error reviewing auth:', error);
      return null;
    }
  },

  // 获取所有打手游戏信息（管理员/客服查看）
  async getAllPlayerGameInfo(): Promise<PlayerGameInfo[]> {
    if (!isSupabaseConfigured) return [];
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('player_game_info')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching player game info:', error);
      return [];
    }
  },

  // 根据游戏平台筛选打手
  async getPlayersByPlatform(platformId: string): Promise<PlayerGameInfo[]> {
    if (!isSupabaseConfigured) return [];
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('player_game_auth')
        .select(`
          *,
          profiles (
            username,
            reputation
          ),
          game_platforms (
            display_name
          )
        `)
        .eq('platform_id', platformId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching players by platform:', error);
      return [];
    }
  },

  // 搜索打手
  async searchPlayers(query: {
    platform_id?: string;
    character_name?: string;
    game_uid?: string;
    rank_level?: string;
  }): Promise<PlayerGameInfo[]> {
    if (!isSupabaseConfigured) return [];
    
    try {
      const client = getSupabaseClient();
      let queryBuilder = client
        .from('player_game_auth')
        .select(`
          *,
          profiles (
            username,
            reputation
          ),
          game_platforms (
            display_name
          )
        `)
        .eq('status', 'approved');

      if (query.platform_id) {
        queryBuilder = queryBuilder.eq('platform_id', query.platform_id);
      }
      if (query.character_name) {
        queryBuilder = queryBuilder.ilike('character_name', `%${query.character_name}%`);
      }
      if (query.game_uid) {
        queryBuilder = queryBuilder.ilike('game_uid', `%${query.game_uid}%`);
      }
      if (query.rank_level) {
        queryBuilder = queryBuilder.eq('rank_level', query.rank_level);
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching players:', error);
      return [];
    }
  }
};

// 获取可用的打手（用于任务分配）
export async function getAvailablePlayersForTask(taskId: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase client not configured');
  
  const client = getSupabaseClient();
  const { data, error } = await client
    .rpc('get_available_players_for_task', { task_uuid: taskId });
  
  if (error) throw error;
  return data || [];
}