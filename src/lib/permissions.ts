// 权限管理系统
export type UserRole = 'user' | 'player' | 'csr' | 'admin' | 'super_admin';

export type Permission = 
  // 基础权限
  | 'view_tasks'
  | 'claim_tasks'
  | 'create_tasks'
  | 'manage_own_tasks'
  
  // 用户管理权限
  | 'view_users'
  | 'manage_users'
  | 'view_user_details'
  | 'suspend_users'
  | 'delete_users'
  
  // 游戏认证权限
  | 'submit_game_auth'
  | 'view_game_auth'
  | 'review_game_auth'
  | 'manage_game_platforms'
  
  // 客服权限
  | 'access_csr_console'
  | 'manage_csr_applications'
  | 'review_csr_applications'
  
  // 管理员权限
  | 'access_admin_dashboard'
  | 'view_system_stats'
  | 'manage_system_settings'
  | 'view_audit_logs'
  
  // 超级管理员权限
  | 'manage_admins'
  | 'system_maintenance'
  | 'data_export'
  | 'security_settings';

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'view_tasks'
  ],
  
  player: [
    'view_tasks',
    'claim_tasks',
    'manage_own_tasks',
    'submit_game_auth',
    'view_game_auth'
  ],
  
  csr: [
    'view_tasks',
    'claim_tasks',
    'create_tasks',
    'manage_own_tasks',
    'submit_game_auth',
    'view_game_auth',
    'view_users',
    'view_user_details',
    'access_csr_console',
    'manage_csr_applications'
  ],
  
  admin: [
    'view_tasks',
    'claim_tasks',
    'create_tasks',
    'manage_own_tasks',
    'submit_game_auth',
    'view_game_auth',
    'review_game_auth',
    'manage_game_platforms',
    'view_users',
    'manage_users',
    'view_user_details',
    'suspend_users',
    'access_csr_console',
    'manage_csr_applications',
    'review_csr_applications',
    'access_admin_dashboard',
    'view_system_stats',
    'manage_system_settings',
    'view_audit_logs'
  ],
  
  super_admin: [
    'view_tasks',
    'claim_tasks',
    'create_tasks',
    'manage_own_tasks',
    'submit_game_auth',
    'view_game_auth',
    'review_game_auth',
    'manage_game_platforms',
    'view_users',
    'manage_users',
    'view_user_details',
    'suspend_users',
    'delete_users',
    'access_csr_console',
    'manage_csr_applications',
    'review_csr_applications',
    'access_admin_dashboard',
    'view_system_stats',
    'manage_system_settings',
    'view_audit_logs',
    'manage_admins',
    'system_maintenance',
    'data_export',
    'security_settings'
  ]
};

// 权限检查函数
export const hasPermission = (userRole: UserRole | undefined, permission: Permission): boolean => {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

// 检查用户是否有多个权限中的任意一个
export const hasAnyPermission = (userRole: UserRole | undefined, permissions: Permission[]): boolean => {
  if (!userRole) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

// 检查用户是否有所有指定权限
export const hasAllPermissions = (userRole: UserRole | undefined, permissions: Permission[]): boolean => {
  if (!userRole) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

// 获取用户的所有权限
export const getUserPermissions = (userRole: UserRole | undefined): Permission[] => {
  if (!userRole) return [];
  return ROLE_PERMISSIONS[userRole] || [];
};

// 角色层级检查（用于确定是否可以管理其他用户）
export const canManageRole = (managerRole: UserRole | undefined, targetRole: UserRole): boolean => {
  if (!managerRole) return false;
  
  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    player: 1,
    csr: 2,
    admin: 3,
    super_admin: 4
  };
  
  return roleHierarchy[managerRole] > roleHierarchy[targetRole];
};

// 获取角色显示名称
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    user: '普通用户',
    player: '打手',
    csr: '客服',
    admin: '管理员',
    super_admin: '超级管理员'
  };
  
  return roleNames[role] || role;
};

// 获取角色颜色
export const getRoleColor = (role: UserRole): string => {
  const roleColors: Record<UserRole, string> = {
    user: 'text-gray-400 bg-gray-400/10',
    player: 'text-blue-400 bg-blue-400/10',
    csr: 'text-green-400 bg-green-400/10',
    admin: 'text-yellow-400 bg-yellow-400/10',
    super_admin: 'text-red-400 bg-red-400/10'
  };
  
  return roleColors[role] || 'text-gray-400 bg-gray-400/10';
};

// 权限描述
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  view_tasks: '查看任务',
  claim_tasks: '抢单',
  create_tasks: '创建任务',
  manage_own_tasks: '管理自己的任务',
  
  view_users: '查看用户列表',
  manage_users: '管理用户',
  view_user_details: '查看用户详情',
  suspend_users: '暂停用户',
  delete_users: '删除用户',
  
  submit_game_auth: '提交游戏认证',
  view_game_auth: '查看游戏认证',
  review_game_auth: '审核游戏认证',
  manage_game_platforms: '管理游戏平台',
  
  access_csr_console: '访问客服控制台',
  manage_csr_applications: '管理客服申请',
  review_csr_applications: '审核客服申请',
  
  access_admin_dashboard: '访问管理员后台',
  view_system_stats: '查看系统统计',
  manage_system_settings: '管理系统设置',
  view_audit_logs: '查看审计日志',
  
  manage_admins: '管理管理员',
  system_maintenance: '系统维护',
  data_export: '数据导出',
  security_settings: '安全设置'
};