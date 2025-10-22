import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Shield, CheckCircle, XCircle, Clock, Upload, Trash2 } from 'lucide-react';
import { gamePlatformService, playerGameAuthService } from '../lib/gameAuth';
import type { GamePlatform, PlayerGameAuth } from '../lib/types';
import { toast } from 'sonner';

const GameAuth: React.FC = () => {
  const [platforms, setPlatforms] = useState<GamePlatform[]>([]);
  const [myAuth, setMyAuth] = useState<PlayerGameAuth[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    platform_id: '',
    game_uid: '',
    character_name: '',
    server_region: '',
    rank_level: '',
    verification_screenshot: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [platformsData, authData] = await Promise.all([
        gamePlatformService.getAll(),
        playerGameAuthService.getMyAuth()
      ]);
      setPlatforms(platformsData);
      setMyAuth(authData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.platform_id || !formData.game_uid || !formData.character_name) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      setSubmitting(true);
      await playerGameAuthService.submitAuth(formData);
      toast.success('游戏认证申请已提交，等待审核');
      setShowAddForm(false);
      setFormData({
        platform_id: '',
        game_uid: '',
        character_name: '',
        server_region: '',
        rank_level: '',
        verification_screenshot: ''
      });
      loadData();
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个游戏认证吗？')) return;

    try {
      await playerGameAuthService.deleteAuth(id);
      toast.success('删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '已认证';
      case 'rejected':
        return '已拒绝';
      default:
        return '待审核';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="page-container bg-dark-900">
      <div className="page-content">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary-400" />
            <h1 className="text-3xl font-bold gradient-text">游戏认证管理</h1>
          </div>
          <p className="text-dark-400">
            管理您的游戏账号认证信息，通过认证后可接取对应游戏的任务
          </p>
        </motion.div>

        {/* 添加认证按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            添加游戏认证
          </button>
        </motion.div>

        {/* 认证列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {myAuth.map((auth, index) => (
            <motion.div
              key={auth.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {platforms.find(p => p.id === auth.platform_id)?.display_name}
                    </h3>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(auth.status)}`}>
                      {getStatusIcon(auth.status)}
                      {getStatusText(auth.status)}
                    </div>
                  </div>
                </div>
                {auth.status === 'pending' && (
                  <button
                    onClick={() => handleDelete(auth.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">游戏UID:</span>
                  <span className="text-white font-mono">{auth.game_uid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">角色名:</span>
                  <span className="text-white">{auth.character_name}</span>
                </div>
                {auth.server_region && (
                  <div className="flex justify-between">
                    <span className="text-dark-400">服务器:</span>
                    <span className="text-white">{auth.server_region}</span>
                  </div>
                )}
                {auth.rank_level && (
                  <div className="flex justify-between">
                    <span className="text-dark-400">段位:</span>
                    <span className="text-white">{auth.rank_level}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-dark-400">申请时间:</span>
                  <span className="text-white">
                    {new Date(auth.created_at).toLocaleDateString()}
                  </span>
                </div>
                {auth.verified_at && (
                  <div className="flex justify-between">
                    <span className="text-dark-400">审核时间:</span>
                    <span className="text-white">
                      {new Date(auth.verified_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {myAuth.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <Shield className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark-400 mb-2">暂无游戏认证</h3>
            <p className="text-dark-500">添加您的游戏账号认证，开始接取任务</p>
          </motion.div>
        )}
      </div>

      {/* 添加认证表单模态框 */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-6">添加游戏认证</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    游戏平台 *
                  </label>
                  <select
                    value={formData.platform_id}
                    onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
                    className="input-field w-full"
                    required
                  >
                    <option value="">选择游戏平台</option>
                    {platforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    游戏UID *
                  </label>
                  <input
                    type="text"
                    value={formData.game_uid}
                    onChange={(e) => setFormData({ ...formData, game_uid: e.target.value })}
                    className="input-field w-full"
                    placeholder="输入游戏UID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    角色名 *
                  </label>
                  <input
                    type="text"
                    value={formData.character_name}
                    onChange={(e) => setFormData({ ...formData, character_name: e.target.value })}
                    className="input-field w-full"
                    placeholder="输入角色名"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    服务器区域
                  </label>
                  <input
                    type="text"
                    value={formData.server_region}
                    onChange={(e) => setFormData({ ...formData, server_region: e.target.value })}
                    className="input-field w-full"
                    placeholder="如：微信区、QQ区"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    当前段位
                  </label>
                  <input
                    type="text"
                    value={formData.rank_level}
                    onChange={(e) => setFormData({ ...formData, rank_level: e.target.value })}
                    className="input-field w-full"
                    placeholder="如：王者、钻石"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    认证截图URL
                  </label>
                  <input
                    type="url"
                    value={formData.verification_screenshot}
                    onChange={(e) => setFormData({ ...formData, verification_screenshot: e.target.value })}
                    className="input-field w-full"
                    placeholder="上传游戏界面截图链接"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-outline flex-1"
                    disabled={submitting}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? '提交中...' : '提交申请'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameAuth;