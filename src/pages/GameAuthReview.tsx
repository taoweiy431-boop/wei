import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Clock, Eye, Search, Filter } from 'lucide-react';
import { playerGameAuthService, gamePlatformService } from '../lib/gameAuth';
import type { PlayerGameAuth, GamePlatform } from '../lib/types';
import { toast } from 'sonner';
import { useAuthSimple } from '@/lib/auth';
import { PermissionGuard } from '@/components/PermissionGuard';

const GameAuthReview: React.FC = () => {
  const [auths, setAuths] = useState<PlayerGameAuth[]>([]);
  const [platforms, setPlatforms] = useState<GamePlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [authsData, platformsData] = await Promise.all([
        playerGameAuthService.getAllPlayerGameInfo(),
        gamePlatformService.getAll()
      ]);
      setAuths(authsData);
      setPlatforms(platformsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      await playerGameAuthService.reviewAuth(id, status, notes);
      toast.success(status === 'approved' ? '认证已通过' : '认证已拒绝');
      loadData();
    } catch (error) {
      console.error('审核失败:', error);
      toast.error('审核失败');
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
        return '已通过';
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

  const filteredAuths = auths.filter(auth => {
    const matchesFilter = filter === 'all' || auth.status === filter;
    const matchesSearch = !searchTerm || 
      auth.character_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auth.game_uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (auth.player_name && auth.player_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = !selectedPlatform || auth.platform_id === selectedPlatform;
    
    return matchesFilter && matchesSearch && matchesPlatform;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="review_game_auth">
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
            <h1 className="text-3xl font-bold gradient-text">游戏认证审核</h1>
          </div>
          <p className="text-dark-400">
            审核玩家提交的游戏认证申请，确保信息真实有效
          </p>
        </motion.div>

        {/* 筛选和搜索 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <div className="flex flex-wrap gap-4 items-center">
            {/* 状态筛选 */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-dark-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="input-field"
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>

            {/* 平台筛选 */}
            <div>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="input-field"
              >
                <option value="">全部平台</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 搜索 */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full"
                  placeholder="搜索玩家名、角色名或UID..."
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
              {auths.length}
            </div>
            <div className="text-dark-400">总申请数</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {auths.filter(a => a.status === 'pending').length}
            </div>
            <div className="text-dark-400">待审核</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {auths.filter(a => a.status === 'approved').length}
            </div>
            <div className="text-dark-400">已通过</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {auths.filter(a => a.status === 'rejected').length}
            </div>
            <div className="text-dark-400">已拒绝</div>
          </div>
        </motion.div>

        {/* 认证列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {filteredAuths.map((auth, index) => (
            <motion.div
              key={auth.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-hover"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* 基本信息 */}
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">
                          {auth.player_name || '未知玩家'}
                        </h3>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(auth.status)}`}>
                          {getStatusIcon(auth.status)}
                          {getStatusText(auth.status)}
                        </div>
                      </div>
                      <div className="text-sm text-dark-400">
                        {platforms.find(p => p.id === auth.platform_id)?.display_name}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-dark-400">游戏UID:</span>
                      <div className="text-white font-mono">{auth.game_uid}</div>
                    </div>
                    <div>
                      <span className="text-dark-400">角色名:</span>
                      <div className="text-white">{auth.character_name}</div>
                    </div>
                    {auth.server_region && (
                      <div>
                        <span className="text-dark-400">服务器:</span>
                        <div className="text-white">{auth.server_region}</div>
                      </div>
                    )}
                    {auth.rank_level && (
                      <div>
                        <span className="text-dark-400">段位:</span>
                        <div className="text-white">{auth.rank_level}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-xs text-dark-500">
                    <span>申请时间: {new Date(auth.created_at).toLocaleString()}</span>
                    {auth.verified_at && (
                      <span>审核时间: {new Date(auth.verified_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {/* 认证截图 */}
                {auth.verification_screenshot && (
                  <div className="lg:w-48">
                    <div className="text-sm text-dark-400 mb-2">认证截图:</div>
                    <div className="relative group">
                      <img
                        src={auth.verification_screenshot}
                        alt="认证截图"
                        className="w-full h-32 object-cover rounded-lg border border-dark-600"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                {auth.status === 'pending' && (
                  <div className="flex flex-col gap-2 lg:w-32">
                    <button
                      onClick={() => handleReview(auth.id, 'approved')}
                      className="btn-primary text-sm py-2"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      通过
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('请输入拒绝原因（可选）:');
                        if (notes !== null) {
                          handleReview(auth.id, 'rejected', notes);
                        }
                      }}
                      className="btn-outline text-sm py-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      拒绝
                    </button>
                  </div>
                )}
              </div>

              {/* 审核备注 */}
              {auth.review_notes && (
                <div className="mt-4 p-3 bg-dark-800/50 rounded-lg border border-dark-600">
                  <div className="text-sm text-dark-400 mb-1">审核备注:</div>
                  <div className="text-sm text-white">{auth.review_notes}</div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {filteredAuths.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-12"
          >
            <Shield className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark-400 mb-2">暂无认证申请</h3>
            <p className="text-dark-500">
              {filter === 'pending' ? '暂无待审核的认证申请' : '没有找到符合条件的认证申请'}
            </p>
          </motion.div>
        )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default GameAuthReview;