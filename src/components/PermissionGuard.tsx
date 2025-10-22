import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { useAuthSimple } from '@/lib/auth';
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission, UserRole } from '@/lib/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // 是否需要所有权限，默认为 false（任意一个即可）
  role?: UserRole;
  fallback?: React.ReactNode;
  showFallback?: boolean; // 是否显示默认的权限不足提示
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  fallback,
  showFallback = true
}) => {
  const { user } = useAuthSimple();
  
  // 获取用户角色
  const userRole = user?.role as UserRole | undefined;
  
  // 如果指定了特定角色，检查用户是否具有该角色
  if (role && userRole !== role) {
    return showFallback ? (
      fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-semibold text-white mb-2">权限不足</h3>
            <p className="text-dark-400">您需要 {role} 角色才能访问此内容</p>
          </div>
        </div>
      )
    ) : null;
  }
  
  // 检查单个权限
  if (permission && !hasPermission(userRole, permission)) {
    return showFallback ? (
      fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-semibold text-white mb-2">权限不足</h3>
            <p className="text-dark-400">您没有权限访问此内容</p>
          </div>
        </div>
      )
    ) : null;
  }
  
  // 检查多个权限
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(userRole, permissions)
      : hasAnyPermission(userRole, permissions);
      
    if (!hasRequiredPermissions) {
      return showFallback ? (
        fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-semibold text-white mb-2">权限不足</h3>
              <p className="text-dark-400">
                您需要{requireAll ? '所有' : '以下任意一个'}权限才能访问此内容
              </p>
            </div>
          </div>
        )
      ) : null;
    }
  }
  
  return <>{children}</>;
};

// 权限检查 Hook
export const usePermissions = () => {
  const { user } = useAuthSimple();
  const userRole = user?.role as UserRole | undefined;
  
  return {
    userRole,
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    canAccess: (permission: Permission) => hasPermission(userRole, permission)
  };
};

// 条件渲染组件
interface ConditionalRenderProps {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  condition,
  children,
  fallback = null
}) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};

// 角色徽章组件
interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      player: '打手',
      csr: '客服',
      admin: '管理员',
      super_admin: '超级管理员'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: UserRole): string => {
    const roleColors: Record<UserRole, string> = {
      player: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
      csr: 'text-green-400 bg-green-400/10 border-green-400/30',
      admin: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
      super_admin: 'text-red-400 bg-red-400/10 border-red-400/30'
    };
    return roleColors[role] || 'text-gray-400 bg-gray-400/10 border-gray-400/30';
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${getRoleColor(role)} ${sizeClasses[size]}`}>
      {getRoleDisplayName(role)}
    </span>
  );
};

export default PermissionGuard;