import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from './types';
import type { UserRole } from './permissions';

interface AuthContextType {
  user: (User & { role?: UserRole; profile?: Profile }) | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 简化的 hook 实现，用于当前组件
export const useAuthSimple = () => {
  const [user, setUser] = useState<(User & { role?: UserRole; profile?: Profile }) | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取用户资料和角色信息
  const fetchUserProfile = async (authUser: User) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { ...authUser };
      }

      return {
        ...authUser,
        role: profile?.role as UserRole,
        profile: profile as Profile
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return { ...authUser };
    }
  };

  const refreshProfile = async () => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    try {
      const { data: { user: authUser } } = await supabase!.auth.getUser();
      if (authUser) {
        const userWithProfile = await fetchUserProfile(authUser);
        setUser(userWithProfile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 获取当前用户
    const initializeAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase!.auth.getUser();
        if (authUser) {
          const userWithProfile = await fetchUserProfile(authUser);
          setUser(userWithProfile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 监听认证状态变化
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          const userWithProfile = await fetchUserProfile(session.user);
          setUser(userWithProfile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const register = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase!.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase!.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    refreshProfile,
  };
};

// 为了兼容现有代码，导出一个简单的 useAuth hook
export const useAuth = useAuthSimple;