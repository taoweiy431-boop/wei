import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Volume2, 
  VolumeX,
  Gamepad2,
  Star,
  Trophy,
  Timer
} from 'lucide-react';
import { useAuthSimple } from '@/lib/auth';
import { taskService } from '@/lib/api';
import { dispatchReminderService, notificationManager, webSocketManager } from '@/lib/notifications';
import { Task, DispatchReminder } from '@/lib/types';

const PlayerWorkspace: React.FC = () => {
  const { user } = useAuthSimple();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    earnings: 0
  });

  useEffect(() => {
    if (user) {
      loadData();
      initializeNotifications();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 加载用户任务
      const userTasks = await taskService.getUserTasks(user.id);
      setTasks(userTasks);

      // 加载派单提醒
      const userReminders = await dispatchReminderService.getUserReminders(user.id);
      setReminders(userReminders);

      // 计算统计数据
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(t => t.status === 'completed').length;
      const pendingTasks = userTasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length;
      const earnings = userTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.reward, 0);

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        earnings
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeNotifications = async () => {
    if (!user) return;

    // 初始化音频
    await notificationManager.initAudio();
    
    // 连接实时通知
    webSocketManager.connect(user.id);

    // 订阅通知
    notificationManager.subscribe((notification) => {
      if (soundEnabled && notification.type === 'task_dispatch') {
        // 播放声音并显示提醒
        notificationManager.playNotificationSound();
      }
      
      // 重新加载数据
      loadData();
    });
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const testNotification = async () => {
    if (user) {
      await notificationManager.handleTaskDispatch('test-task-id', user.id);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

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
    <div className="page-container">
      <div className="page-content">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">打手工作台</h1>
            <p className="text-dark-400 mt-2">管理您的任务和接收派单提醒</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSound}
              className={`p-3 rounded-lg transition-all duration-200 ${
                soundEnabled 
                  ? 'bg-primary-500 text-white shadow-glow' 
                  : 'bg-dark-700 text-dark-400'
              }`}
              title={soundEnabled ? '关闭声音提醒' : '开启声音提醒'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            
            <button
              onClick={testNotification}
              className="btn-outline"
            >
              测试通知
            </button>
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
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">已完成</p>
                <p className="text-2xl font-bold text-white">{stats.completedTasks}</p>
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
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">进行中</p>
                <p className="text-2xl font-bold text-white">{stats.pendingTasks}</p>
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
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">总收益</p>
                <p className="text-2xl font-bold text-white">¥{stats.earnings}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 当前任务 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-6">
              <Gamepad2 className="w-5 h-5 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">当前任务</h2>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {tasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length === 0 ? (
                <div className="text-center py-8 text-dark-400">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无进行中的任务</p>
                </div>
              ) : (
                tasks
                  .filter(t => ['assigned', 'in_progress'].includes(t.status))
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-dark-700 rounded-lg border border-dark-600 hover:border-primary-500 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-white">{task.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${getTaskStatusColor(task.status)}`}>
                          {getTaskStatusText(task.status)}
                        </span>
                      </div>
                      <p className="text-dark-300 text-sm mb-3">{task.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-yellow-400">¥{task.reward}</span>
                        <span className="text-dark-400">{formatTime(task.created_at)}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </motion.div>

          {/* 派单提醒 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-semibold text-white">派单提醒</h2>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {reminders.length === 0 ? (
                <div className="text-center py-8 text-dark-400">
                  <Timer className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无派单提醒</p>
                </div>
              ) : (
                reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="p-4 bg-dark-700 rounded-lg border border-dark-600"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white">
                        {reminder.task?.title || '任务提醒'}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        reminder.status === 'pending' ? 'text-yellow-400 bg-yellow-400/10' :
                        reminder.status === 'sent' ? 'text-blue-400 bg-blue-400/10' :
                        reminder.status === 'acknowledged' ? 'text-green-400 bg-green-400/10' :
                        'text-red-400 bg-red-400/10'
                      }`}>
                        {reminder.status === 'pending' ? '待发送' :
                         reminder.status === 'sent' ? '已发送' :
                         reminder.status === 'acknowledged' ? '已确认' : '已过期'}
                      </span>
                    </div>
                    <p className="text-dark-300 text-sm mb-3">{reminder.message}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">
                        预定时间: {formatTime(reminder.scheduled_at)}
                      </span>
                      <span className="text-dark-500">
                        {formatTime(reminder.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* 最近完成的任务 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card mt-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold text-white">最近完成</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks
              .filter(t => t.status === 'completed')
              .slice(0, 6)
              .map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-dark-700 rounded-lg border border-dark-600"
                >
                  <h3 className="font-medium text-white mb-2">{task.title}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-400">¥{task.reward}</span>
                    <span className="text-dark-400">{formatTime(task.updated_at)}</span>
                  </div>
                </div>
              ))}
          </div>

          {tasks.filter(t => t.status === 'completed').length === 0 && (
            <div className="text-center py-8 text-dark-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无已完成的任务</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PlayerWorkspace;