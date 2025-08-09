import { useSelector } from 'react-redux';
import { useMemo } from 'react';

/**
 * Custom hook for authentication state and role checking
 * Provides consistent auth logic across components
 */
export const useAuth = () => {
  const { user, isAuthenticated, isLoading, token } = useSelector((state) => state.auth);

  const hasRole = useMemo(() => (role) => {
    if (!user || !user.roles) return false;
    
    if (Array.isArray(user.roles)) {
      return user.roles.includes(role);
    }
    
    if (typeof user.roles === 'string') {
      return user.roles === role;
    }
    
    return false;
  }, [user]);

  const hasAnyRole = useMemo(() => (roles) => {
    if (!user || !user.roles || !Array.isArray(roles)) return false;
    return roles.some(role => hasRole(role));
  }, [user, hasRole]);

  const isAdmin = useMemo(() => {
    return hasRole('admin') || hasRole('administrator');
  }, [hasRole]);

  const isSuperAdmin = useMemo(() => {
    return hasRole('super_admin') || hasRole('superadmin');
  }, [hasRole]);

  const canAccess = useMemo(() => (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!isAuthenticated) return false;
    
    if (Array.isArray(requiredRoles)) {
      return hasAnyRole(requiredRoles);
    }
    
    return hasRole(requiredRoles);
  }, [isAuthenticated, hasRole, hasAnyRole]);

  const userPermissions = useMemo(() => {
    if (!user) return [];
    
    return user.permissions || [];
  }, [user]);

  const hasPermission = useMemo(() => (permission) => {
    return userPermissions.includes(permission);
  }, [userPermissions]);

  const userProfile = useMemo(() => {
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      roles: user.roles,
      permissions: user.permissions,
      createdAt: user.created_at,
      emailVerifiedAt: user.email_verified_at
    };
  }, [user]);

  return {
    user: userProfile,
    isAuthenticated,
    isLoading,
    token,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    canAccess,
    hasPermission,
    userPermissions
  };
};

export default useAuth;
