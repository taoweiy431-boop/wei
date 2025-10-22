import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Calendar,
  BarChart3,
  PieChart,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Gamepad2,
  UserCheck,
  Settings
} from 'lucide-react';
import { useAuthSimple } from '@/lib/auth';
import { PermissionGuard } from '@/components/PermissionGuard';
import { taskService, userService, csrService } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Task, Profile, CSRApplication } from '@/lib/types';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  totalRevenue: number;
  pendingApplications: number;
  averageTaskTime: number;
  userGrowthRate: number;
}

interface TaskStats {
  open: number;
  claimed: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

interface UserRoleStats {
  player: number;
  csr: number;
  admin: number;
  super_admin: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuthSimple();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalRevenue: 0,
    pendingApplications: 0,
    averageTaskTime: 0,
    userGrowthRate: 0
  });
  const [taskStats, setTaskStats] = useState<TaskStats>({
    open: 0,
    claimed: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  });
  const [userRoleStats, setUserRoleStats] = useState<UserRoleStats>({
    player: 0,
    csr: 0,
    admin: 0,
    super_admin: 0
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);

  useEffect(() => {
    if (user && user.role && ['admin', 'super_admin'].includes(user.role)) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 获取所有任务
      const tasks = await taskService.getOpenTasks();
      
      // 获取所有用户
      const users = await userService.getAllUsers();
      
      // 获取客服申请
      const applications = await csrService.getAllApplications();

      // 计算任务统计
      const taskStatistics: TaskStats = {
        open: tasks.filter(t => t.status === 'open').length,
        claimed: tasks.filter(t => t.status === 'claimed').length,
        assigned: tasks.filter(t => t.status === 'assigned').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length
      };
      setTaskStats(taskStatistics);

      // 计算用户角色统计
      const roleStatistics: UserRoleStats = {
        player: users.filter(u => u.role === 'player').length,
        csr: users.filter(u => u.role === 'csr').length,
        admin: users.filter(u => u.role === 'admin').length,
        super_admin: users.filter(u => u.role === 'super_admin').length
      };
      setUserRoleStats(roleStatistics);

      // 计算总收入
      const totalRevenue = tasks
        .filter(t => t.status === 'completed')
        .reduce((sum, task) => sum + task.reward, 0);

      // 计算活跃用户（最近30天有活动的用户）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = users.filter(u => 
        new Date(u.updated_at || u.created_at) > thirtyDaysAgo
      ).length;

      // 计算用户增长率（简化版本）
      const userGrowthRate = users.length > 0 ? 
        Math.round((activeUsers / users.length) * 100) : 0;

      // 计算平均任务完成时间（小时）
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const averageTaskTime = completedTasks.length > 0 ? 
        completedTasks.reduce((sum, task) => {
          const created = new Date(task.created_at);
          const updated = new Date(task.updated_at || task.created_at);
          return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
        }, 0) / completedTasks.length : 0;

      setStats({
        totalUsers: users.length,
        activeUsers,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        totalRevenue,
        pendingApplications: applications.filter(a => a.status === 'pending').length,
        averageTaskTime: Math.round(averageTaskTime * 10) / 10,
        userGrowthRate
      });

      // 设置最近的任务和用户
      setRecentTasks(tasks.slice(0, 5));
      setRecentUsers(users.slice(0, 5));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-400';
      case 'claimed': return 'text-yellow-400';
      case 'assigned': return 'text-purple-400';
      case 'in_progress': return 'text-orange-400';
      case 'completed': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'open': return '开放';
      case 'claimed': return '已抢';
      case 'assigned': return '已派单';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  if (!user || !user.role || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-white mb-2">访问被拒绝</h2>
            <p className="text-dark-400">您没有权限访问管理员后台</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="access_admin_dashboard">
      <div className="page-container">
        <div className="page-content">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">管理员后台</h1>
            <p className="text-dark-400 mt-2">系统概览与数据分析</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="btn-outline"
          >
            刷新数据
          </button>
        </div>

        {/* 主要统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">总用户数</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-xs text-green-400">活跃: {stats.activeUsers}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">总任务数</p>
                <p className="text-2xl font-bold text-white">{stats.totalTasks}</p>
                <p className="text-xs text-green-400">完成: {stats.completedTasks}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">总收入</p>
                <p className="text-2xl font-bold text-white">¥{stats.totalRevenue}</p>
                <p className="text-xs text-green-400">+{stats.userGrowthRate}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">平均完成时间</p>
                <p className="text-2xl font-bold text-white">{stats.averageTaskTime}h</p>
                <p className="text-xs text-orange-400">待审核: {stats.pendingApplications}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 任务状态分布 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-primary-400" />
              <h3 className="text-lg font-semibold text-white">任务状态分布</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(taskStats).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'open' ? 'bg-blue-400' :
                      status === 'claimed' ? 'bg-yellow-400' :
                      status === 'assigned' ? 'bg-purple-400' :
                      status === 'in_progress' ? 'bg-orange-400' :
                      status === 'completed' ? 'bg-green-400' :
                      'bg-red-400'
                    }`}></div>
                    <span className="text-dark-300">{getTaskStatusText(status)}</span>
                  </div>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 用户角色分布 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-accent-400" />
              <h3 className="text-lg font-semibold text-white">用户角色分布</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-4 h-4 text-blue-400" />
                  <span className="text-dark-300">打手</span>
                </div>
                <span className="text-white font-semibold">{userRoleStats.player}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-green-400" />
                  <span className="text-dark-300">客服</span>
                </div>
                <span className="text-white font-semibold">{userRoleStats.csr}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-yellow-400" />
                  <span className="text-dark-300">管理员</span>
                </div>
                <span className="text-white font-semibold">{userRoleStats.admin}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="text-dark-300">超级管理员</span>
                </div>
                <span className="text-white font-semibold">{userRoleStats.super_admin}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 最近活动 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 最近任务 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-primary-400" />
              <h3 className="text-lg font-semibold text-white">最近任务</h3>
            </div>
            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <p className="text-dark-400 text-center py-4">暂无任务</p>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">{task.title}</p>
                      <p className="text-dark-400 text-xs">¥{task.reward}</p>
                    </div>
                    <span className={`text-xs ${getTaskStatusColor(task.status)}`}>
                      {getTaskStatusText(task.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* 最近用户 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-accent-400" />
              <h3 className="text-lg font-semibold text-white">最近用户</h3>
            </div>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-dark-400 text-center py-4">暂无用户</p>
              ) : (
                recentUsers.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-500/20 rounded-lg">
                        <Users className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{profile.username}</p>
                        <p className="text-dark-400 text-xs">{profile.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-dark-300">{profile.reputation}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default AdminDashboard;