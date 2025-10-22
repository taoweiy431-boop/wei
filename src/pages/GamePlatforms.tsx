import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Gamepad2, Eye, EyeOff, Save, X } from 'lucide-react';
import { gamePlatformService } from '../lib/gameAuth';
import type { GamePlatform } from '../lib/types';
import { toast } from 'sonner';

const GamePlatforms: React.FC = () => {
  const [platforms, setPlatforms] = useState<GamePlatform[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    icon_url: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      const data = await gamePlatformService.getAll();
      setPlatforms(data);
    } catch (error) {
      console.error('加载游戏平台失败:', error);
      toast.error('加载游戏平台失败');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      icon_url: '',
      description: '',
      is_active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.display_name) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await gamePlatformService.update(editingId, formData);
        toast.success('更新成功');
        setEditingId(null);
      } else {
        await gamePlatformService.create(formData);
        toast.success('创建成功');
        setShowAddForm(false);
      }
      resetForm();
      loadPlatforms();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error('操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (platform: GamePlatform) => {
    setFormData({
      name: platform.name,
      display_name: platform.display_name,
      icon_url: platform.icon_url || '',
      description: platform.description || '',
      is_active: platform.is_active
    });
    setEditingId(platform.id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleToggleActive = async (platform: GamePlatform) => {
    try {
      await gamePlatformService.update(platform.id, {
        ...platform,
        is_active: !platform.is_active
      });
      toast.success(platform.is_active ? '已禁用' : '已启用');
      loadPlatforms();
    } catch (error) {
      console.error('状态切换失败:', error);
      toast.error('状态切换失败');
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
            <Gamepad2 className="w-8 h-8 text-primary-400" />
            <h1 className="text-3xl font-bold gradient-text">游戏平台管理</h1>
          </div>
          <p className="text-dark-400">
            管理系统支持的游戏平台，添加新游戏或编辑现有平台信息
          </p>
        </motion.div>

        {/* 添加平台按钮 */}
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
            添加游戏平台
          </button>
        </motion.div>

        {/* 平台列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`card-hover ${!platform.is_active ? 'opacity-60' : ''}`}
            >
              {editingId === platform.id ? (
                // 编辑模式
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">
                      平台名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field w-full text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">
                      显示名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      className="input-field w-full text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">
                      图标URL
                    </label>
                    <input
                      type="url"
                      value={formData.icon_url}
                      onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                      className="input-field w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">
                      描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input-field w-full text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`active-${platform.id}`}
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                    />
                    <label htmlFor={`active-${platform.id}`} className="text-sm text-dark-300">
                      启用状态
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="btn-primary flex-1 text-sm py-2"
                      disabled={submitting}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn-outline flex-1 text-sm py-2"
                    >
                      <X className="w-4 h-4 mr-1" />
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                // 显示模式
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                        {platform.icon_url ? (
                          <img
                            src={platform.icon_url}
                            alt={platform.display_name}
                            className="w-8 h-8 rounded"
                          />
                        ) : (
                          <Gamepad2 className="w-6 h-6 text-primary-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{platform.display_name}</h3>
                        <p className="text-sm text-dark-400">{platform.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(platform)}
                        className={`p-1 rounded transition-colors ${
                          platform.is_active
                            ? 'text-green-400 hover:text-green-300'
                            : 'text-red-400 hover:text-red-300'
                        }`}
                        title={platform.is_active ? '点击禁用' : '点击启用'}
                      >
                        {platform.is_active ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(platform)}
                        className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {platform.description && (
                    <p className="text-sm text-dark-400 mb-4">{platform.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      platform.is_active
                        ? 'bg-green-400/10 text-green-400'
                        : 'bg-red-400/10 text-red-400'
                    }`}>
                      {platform.is_active ? '已启用' : '已禁用'}
                    </span>
                    <span className="text-dark-500">
                      {new Date(platform.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </motion.div>

        {platforms.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <Gamepad2 className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark-400 mb-2">暂无游戏平台</h3>
            <p className="text-dark-500">添加第一个游戏平台开始使用系统</p>
          </motion.div>
        )}
      </div>

      {/* 添加平台表单模态框 */}
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
              <h2 className="text-xl font-bold text-white mb-6">添加游戏平台</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    平台名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field w-full"
                    placeholder="如：王者荣耀"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    显示名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="input-field w-full"
                    placeholder="如：王者荣耀"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    图标URL
                  </label>
                  <input
                    type="url"
                    value={formData.icon_url}
                    onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                    className="input-field w-full"
                    placeholder="游戏图标链接"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field w-full"
                    rows={3}
                    placeholder="游戏平台描述"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-dark-300">
                    启用状态
                  </label>
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
                    {submitting ? '创建中...' : '创建平台'}
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

export default GamePlatforms;