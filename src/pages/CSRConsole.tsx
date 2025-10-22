import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Phone,
  Mail,
  Star,
  TrendingUp,
  Users,
  Target,
  Headphones
} from 'lucide-react';
import { useAuthSimple } from '@/lib/auth';
import { PermissionGuard } from '@/components/PermissionGuard';
import { taskService, userService, csrService } from '@/lib/api';
import { Task, Profile, CSRApplication } from '@/lib/types';

const CSRConsole: React.FC = () => {
  const { user } = useAuthSimple();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [applications, setApplications] = useState<CSRApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'users' | 'applications'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalTasks: 0,
    activeTasks: 0,
    totalUsers: 0,
    pendingApplications: 0
  });

  useEffect(() => {
    if (user && (user.role === 'csr' || user.role === 'admin' || user.role === 'super_admin')) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 获取任务数据
      const tasksData = await taskService.getOpenTasks();
      setTasks(tasksData);

      // 获取用户数据
      const usersData = await userService.getAllUsers();
      setUsers(usersData);

      // 获取客服申请
      const applicationsData = await csrService.getAllApplications();
      setApplications(applicationsData);

      // 计算统计数据
      setStats({
        totalTasks: tasksData.length,
        activeTasks: tasksData.filter(t => ['open', 'claimed', 'assigned', 'in_progress'].includes(t.status)).length,
        totalUsers: usersData.length,
        pendingApplications: applicationsData.filter(a => a.status === 'pending').length
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, status: Task['status']) => {
    try {
      await taskService.updateTaskStatus(taskId, status);
      await loadData();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleApplicationReview = async (applicationId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!user) return;

    try {
      await csrService.reviewApplication(applicationId, status, user.id, notes);
      await loadData();
    } catch (error) {
      console.error('Failed to review application:', error);
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-400 bg-blue-400/10';
      case 'claimed': return 'text-yellow-400 bg-yellow-400/10';
      case 'assigned': return 'text-purple-400 bg-purple-400/10';
      case 'in_progress': return 'text-orange-400 bg-orange-400/10';
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'cancelled': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
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

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10';
      case 'suspended': return 'text-red-400 bg-red-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getUserStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'suspended': return '暂停';
      case 'pending': return '待审核';
      default: return status;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.real_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user || !user.role || !['csr', 'admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="text-center py-12">
            <Headphones className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-white mb-2">访问被拒绝</h2>
            <p className="text-dark-400">您没有权限访问客服控制台</p>
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
    <PermissionGuard permission="access_csr_console">
      <div className="page-container">
        <div className="page-content">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">客服控制台</h1>
            <p className="text-dark-400 mt-2">管理任务、用户和客服申请</p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">总任务数</p>
                <p className="text-2xl font-bold text-white">{stats.totalTasks}</p>
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
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">活跃任务</p>
                <p className="text-2xl font-bold text-white">{stats.activeTasks}</p>
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
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">总用户数</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
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
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">待审核申请</p>
                <p className="text-2xl font-bold text-white">{stats.pendingApplications}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 标签页 */}
        <div className="card mb-8">
          <div className="flex border-b border-dark-600">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              任务管理
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              用户管理
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'applications'
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              客服申请
            </button>
          </div>

          {/* 筛选器 */}
          <div className="p-6 border-b border-dark-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">所有状态</option>
                {activeTab === 'tasks' && (
                  <>
                    <option value="open">开放</option>
                    <option value="claimed">已抢</option>
                    <option value="assigned">已派单</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </>
                )}
                {activeTab === 'users' && (
                  <>
                    <option value="active">活跃</option>
                    <option value="suspended">暂停</option>
                    <option value="pending">待审核</option>
                  </>
                )}
                {activeTab === 'applications' && (
                  <>
                    <option value="pending">待审核</option>
                    <option value="approved">已通过</option>
                    <option value="rejected">已拒绝</option>
                  </>
                )}
              </select>

              <button
                onClick={loadData}
                className="btn-outline"
              >
                刷新数据
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-6">
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-dark-400">
                    <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>没有找到匹配的任务</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-dark-700 rounded-lg border border-dark-600 hover:border-primary-500 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{task.title}</h3>
                          <p className="text-dark-300 text-sm">{task.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${getTaskStatusColor(task.status)}`}>
                          {getTaskStatusText(task.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-dark-400">
                          <span>奖励: ¥{task.reward}</span>
                          <span>优先级: {task.priority}</span>
                          <span>创建时间: {new Date(task.created_at).toLocaleString('zh-CN')}</span>
                        </div>
                        {task.status === 'open' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTaskStatusUpdate(task.id, 'cancelled')}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                            >
                              取消任务
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-dark-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>没有找到匹配的用户</p>
                  </div>
                ) : (
                  filteredUsers.map((profile) => (
                    <div
                      key={profile.id}
                      className="p-4 bg-dark-700 rounded-lg border border-dark-600"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-500/20 rounded-lg">
                            <User className="w-5 h-5 text-primary-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{profile.username}</h3>
                            <p className="text-dark-300 text-sm">角色: {profile.role}</p>
                            {profile.phone && (
                              <p className="text-dark-300 text-sm">电话: {profile.phone}</p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${getUserStatusColor(profile.status)}`}>
                          {getUserStatusText(profile.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-dark-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            信誉: {profile.reputation}
                          </span>
                          <span>注册时间: {new Date(profile.created_at).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-4">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-8 text-dark-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>没有找到匹配的申请</p>
                  </div>
                ) : (
                  filteredApplications.map((application) => (
                    <div
                      key={application.id}
                      className="p-4 bg-dark-700 rounded-lg border border-dark-600"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{application.real_name}</h3>
                          <div className="text-sm text-dark-300 space-y-1">
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {application.phone}
                            </p>
                            <p>工作经验: {application.experience_years} 年</p>
                            {application.previous_experience && (
                              <p>以往经验: {application.previous_experience}</p>
                            )}
                            {application.application_reason && (
                              <p>申请理由: {application.application_reason}</p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          application.status === 'pending' ? 'text-yellow-400 bg-yellow-400/10' :
                          application.status === 'approved' ? 'text-green-400 bg-green-400/10' :
                          'text-red-400 bg-red-400/10'
                        }`}>
                          {application.status === 'pending' ? '待审核' :
                           application.status === 'approved' ? '已通过' : '已拒绝'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-400">
                          申请时间: {new Date(application.created_at).toLocaleString('zh-CN')}
                        </span>
                        {application.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApplicationReview(application.id, 'approved')}
                              className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                            >
                              通过
                            </button>
                            <button
                              onClick={() => handleApplicationReview(application.id, 'rejected')}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                            >
                              拒绝
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default CSRConsole;