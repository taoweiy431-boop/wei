import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Edit,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Star,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuthSimple } from '@/lib/auth';
import { PermissionGuard, RoleBadge, usePermissions } from '@/components/PermissionGuard';
import { UserRole, getRoleDisplayName, canManageRole } from '@/lib/permissions';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Profile, Role } from '@/lib/types';

interface UserWithProfile extends Profile {
  email?: string;
  last_sign_in_at?: string;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const { user } = useAuthSimple();
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');

  // 获取用户列表
  const fetchUsers = async () => {
    if (!isSupabaseConfigured) return;
    
    try {
      setLoading(true);
      const supabaseClient = getSupabaseClient();
      
      // 获取用户资料
      const { data: profiles, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // 获取认证用户信息
      const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers();
      
      if (authError) throw authError;

      // 合并数据
      const mergedUsers = profiles?.map((profile: Profile) => {
        const authUser = authUsers.users.find((u: any) => u.id === profile.id);
        return {
          ...profile,
          email: authUser?.email,
          last_sign_in_at: authUser?.last_sign_in_at,
          created_at: authUser?.created_at || profile.created_at
        };
      }) || [];

      setUsers(mergedUsers);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 更新用户角色
  const updateUserRole = async (userId: string, newRole: Role) => {
    if (!isSupabaseConfigured) return;
    
    try {
      const supabaseClient = getSupabaseClient();
      
      const { error } = await supabaseClient
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast.success('用户角色更新成功');
    } catch (error) {
      console.error('更新用户角色失败:', error);
      toast.error('更新用户角色失败');
    }
  };

  // 更新用户状态
  const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'pending') => {
    if (!isSupabaseConfigured) return;
    
    try {
      const supabaseClient = getSupabaseClient();
      
      const { error } = await supabaseClient
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status } : u
      ));

      toast.success(`用户已${status === 'active' ? '激活' : status === 'suspended' ? '暂停' : '待审核'}`);
    } catch (error) {
      console.error('更新用户状态失败:', error);
      toast.error('更新用户状态失败');
    }
  };

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // 获取角色图标
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'admin': return Crown;
      case 'super_admin': return Crown;
      case 'csr': return Shield;
      case 'player': return UserCheck;
      default: return Users;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'suspended': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <PermissionGuard permission="manage_users">
      <div className="page-container">
        <div className="page-content">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">用户管理</h1>
              <p className="text-dark-400">管理系统用户和权限</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-dark-400">
                总用户数: <span className="text-white font-semibold">{users.length}</span>
              </div>
            </div>
          </motion.div>

          {/* 筛选和搜索 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card mb-6"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 角色筛选 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  角色筛选
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
                  className="input-field w-full"
                >
                  <option value="all">全部角色</option>
                  <option value="admin">管理员</option>
                  <option value="super_admin">超级管理员</option>
                  <option value="csr">客服</option>
                  <option value="player">打手</option>
                </select>
              </div>

              {/* 状态筛选 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  状态筛选
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended' | 'pending')}
                  className="input-field w-full"
                >
                  <option value="all">全部状态</option>
                  <option value="active">活跃</option>
                  <option value="suspended">暂停</option>
                  <option value="pending">待审核</option>
                </select>
              </div>

              {/* 搜索 */}
              <div className="flex-1 min-w-64">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  搜索用户
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10 w-full"
                    placeholder="搜索用户名或邮箱..."
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 统计信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          >
            <div className="card text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-dark-400">管理员</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {users.filter(u => u.role === 'csr').length}
              </div>
              <div className="text-dark-400">客服</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {users.filter(u => u.role === 'player').length}
              </div>
              <div className="text-dark-400">打手</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-400 mb-1">
                {users.filter(u => u.role === 'super_admin').length}
              </div>
              <div className="text-dark-400">超级管理员</div>
            </div>
          </motion.div>

          {/* 用户列表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-dark-400">加载用户列表...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-dark-400 mb-2">暂无用户</h3>
                <p className="text-dark-500">没有找到符合条件的用户</p>
              </div>
            ) : (
              filteredUsers.map((userItem, index) => {
                const RoleIcon = getRoleIcon(userItem.role);
                const canManage = canManageRole(user?.role, userItem.role);
                
                return (
                  <motion.div
                    key={userItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-hover"
                  >
                    <div className="flex items-center gap-6">
                      {/* 用户头像和基本信息 */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                          <RoleIcon className="w-6 h-6 text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-white">
                              {userItem.username || '未设置用户名'}
                            </h3>
                            <RoleBadge role={userItem.role} />
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(userItem.status)}`}>
                              {userItem.status === 'active' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {userItem.status === 'active' ? '活跃' : userItem.status === 'suspended' ? '暂停' : '待审核'}
                            </div>
                          </div>
                          <div className="text-sm text-dark-400">
                            {userItem.email || '未设置邮箱'}
                          </div>
                        </div>
                      </div>

                      {/* 用户统计 */}
                      <div className="hidden md:flex items-center gap-8 text-sm">
                        <div className="text-center">
                          <div className="text-white font-semibold">
                            {Math.round(userItem.reputation || 0)}
                          </div>
                          <div className="text-dark-400">信誉分</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">
                            {userItem.last_sign_in_at ? 
                              new Date(userItem.last_sign_in_at).toLocaleDateString() : 
                              '从未登录'
                            }
                          </div>
                          <div className="text-dark-400">最后登录</div>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      {canManage && (
                        <div className="flex items-center gap-2">
                          {/* 角色管理 */}
                          <select
                            value={userItem.role}
                            onChange={(e) => updateUserRole(userItem.id, e.target.value as Role)}
                            className="input-field text-sm py-1 px-2 min-w-24"
                            disabled={!hasPermission('manage_users')}
                          >
                            <option value="super_admin">超级管理员</option>
                            <option value="player">打手</option>
                            <option value="csr">客服</option>
                            {user?.role === 'admin' && (
                              <option value="admin">管理员</option>
                            )}
                          </select>

                          {/* 状态切换 */}
                          <button
                            onClick={() => updateUserStatus(
                              userItem.id, 
                              userItem.status === 'active' ? 'suspended' : 'active'
                            )}
                            className={`p-2 rounded-lg transition-colors ${
                              userItem.status === 'active'
                                ? 'text-red-400 hover:bg-red-400/10'
                                : 'text-green-400 hover:bg-green-400/10'
                            }`}
                            title={userItem.status === 'active' ? '暂停用户' : '激活用户'}
                          >
                            {userItem.status === 'active' ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default UserManagement;