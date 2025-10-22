import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Gamepad2,
  Shield,
  Star,
  AlertTriangle
} from 'lucide-react';
import { useAuthSimple } from '@/lib/auth';
import { gameAuthService, userService } from '@/lib/api';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase';
import { PlayerGameAuth, GamePlatform, Profile } from '@/lib/types';

// 扩展类型以包含关联数据
interface PlayerGameAuthWithRelations extends PlayerGameAuth {
  profiles?: {
    username: string;
    role: string;
    reputation: number;
    status: string;
  };
  game_platforms?: {
    name: string;
    display_name: string;
    icon_url?: string;
  };
}

const AdminGameInfo: React.FC = () => {
  const { user } = useAuthSimple();
  const [gameAuths, setGameAuths] = useState<PlayerGameAuthWithRelations[]>([]);
  const [platforms, setPlatforms] = useState<GamePlatform[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedAuth, setSelectedAuth] = useState<PlayerGameAuthWithRelations | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!isSupabaseConfigured) return;
    
    setLoading(true);
    try {
      const supabaseClient = getSupabaseClient();
      // 获取所有游戏认证
      const { data: authData, error: authError } = await supabaseClient
        .from('player_game_auths')
        .select(`
          *,
          game_platforms (
            name,
            display_name,
            icon_url
          ),
          profiles (
            username,
            role,
            reputation,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (authError) throw authError;
      setGameAuths(authData || []);

      // 获取游戏平台
      const platformData = await gameAuthService.getGamePlatforms();
      setPlatforms(platformData);

      // 获取用户资料
      const userData = await userService.getAllUsers();
      setProfiles(userData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setGameAuths([]);
      setPlatforms([]);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (authId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!user) return;

    try {
      await gameAuthService.reviewGameAuth(authId, status, user.id, notes);
      await loadData(); // 重新加载数据
      setShowModal(false);
      setSelectedAuth(null);
    } catch (error) {
      console.error('Failed to review auth:', error);
    }
  };

  const filteredAuths = gameAuths.filter(auth => {
    const matchesSearch = 
      auth.character_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auth.game_uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auth.profiles?.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || auth.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || auth.platform_id === platformFilter;

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'approved': return 'text-green-400 bg-green-400/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待审核';
      case 'approved': return '已通过';
      case 'rejected': return '已拒绝';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-white mb-2">访问被拒绝</h2>
            <p className="text-dark-400">您没有权限访问此页面</p>
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
    <div className="page-container">
      <div className="page-content">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">游戏信息管理</h1>
            <p className="text-dark-400 mt-2">查看和管理打手的游戏认证信息</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-dark-400">
              总计: {gameAuths.length} | 待审核: {gameAuths.filter(a => a.status === 'pending').length}
            </div>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索角色名、UID或用户名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* 状态筛选 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input-field"
            >
              <option value="all">所有状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>

            {/* 平台筛选 */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">所有平台</option>
              {platforms.map(platform => (
                <option key={platform.id} value={platform.id}>
                  {platform.display_name}
                </option>
              ))}
            </select>

            {/* 刷新按钮 */}
            <button
              onClick={loadData}
              className="btn-outline"
            >
              刷新数据
            </button>
          </div>
        </div>

        {/* 游戏认证列表 */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAuths.length === 0 ? (
            <div className="text-center py-12 text-dark-400">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>没有找到匹配的游戏认证信息</p>
            </div>
          ) : (
            filteredAuths.map((auth, index) => (
              <motion.div
                key={auth.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:border-primary-500 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* 游戏平台图标 */}
                    <div className="p-3 bg-primary-500/20 rounded-lg">
                      <Gamepad2 className="w-6 h-6 text-primary-400" />
                    </div>

                    {/* 基本信息 */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{auth.character_name}</h3>
                        <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${getStatusColor(auth.status)}`}>
                          {getStatusIcon(auth.status)}
                          {getStatusText(auth.status)}
                        </span>
                      </div>
                      <div className="text-sm text-dark-300 space-y-1">
                        <p>用户: {auth.profiles?.username}</p>
                        <p>平台: {auth.game_platforms?.display_name}</p>
                        <p>UID: {auth.game_uid}</p>
                        {auth.server_region && <p>服务器: {auth.server_region}</p>}
                        {auth.rank_level && <p>等级: {auth.rank_level}</p>}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedAuth(auth);
                        setShowModal(true);
                      }}
                      className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4 text-dark-300" />
                    </button>

                    {auth.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReview(auth.id, 'approved')}
                          className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                          title="通过审核"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </button>
                        <button
                          onClick={() => handleReview(auth.id, 'rejected')}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                          title="拒绝审核"
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 时间信息 */}
                <div className="mt-4 pt-4 border-t border-dark-600 flex items-center justify-between text-xs text-dark-400">
                  <span>提交时间: {new Date(auth.created_at).toLocaleString('zh-CN')}</span>
                  {auth.verified_at && (
                    <span>审核时间: {new Date(auth.verified_at).toLocaleString('zh-CN')}</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* 详情模态框 */}
        {showModal && selectedAuth && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">游戏认证详情</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-dark-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-dark-400">用户名:</span>
                      <span className="text-white ml-2">{selectedAuth.profiles?.username}</span>
                    </div>
                    <div>
                      <span className="text-dark-400">角色名:</span>
                      <span className="text-white ml-2">{selectedAuth.character_name}</span>
                    </div>
                    <div>
                      <span className="text-dark-400">游戏平台:</span>
                      <span className="text-white ml-2">{selectedAuth.game_platforms?.display_name}</span>
                    </div>
                    <div>
                      <span className="text-dark-400">游戏UID:</span>
                      <span className="text-white ml-2">{selectedAuth.game_uid}</span>
                    </div>
                    {selectedAuth.server_region && (
                      <div>
                        <span className="text-dark-400">服务器:</span>
                        <span className="text-white ml-2">{selectedAuth.server_region}</span>
                      </div>
                    )}
                    {selectedAuth.rank_level && (
                      <div>
                        <span className="text-dark-400">等级:</span>
                        <span className="text-white ml-2">{selectedAuth.rank_level}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 认证截图 */}
                {selectedAuth.verification_screenshot && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">认证截图</h3>
                    <img
                      src={selectedAuth.verification_screenshot}
                      alt="认证截图"
                      className="w-full rounded-lg border border-dark-600"
                    />
                  </div>
                )}

                {/* 审核操作 */}
                {selectedAuth.status === 'pending' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">审核操作</h3>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleReview(selectedAuth.id, 'approved')}
                        className="btn-primary flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        通过审核
                      </button>
                      <button
                        onClick={() => handleReview(selectedAuth.id, 'rejected')}
                        className="btn-outline border-red-500 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        拒绝审核
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGameInfo;