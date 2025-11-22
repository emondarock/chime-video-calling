import { useAuth } from '../contexts/AuthContext';
import {
  hasPermission,
  canView,
  canCreate,
  canJoin,
  canDelete,
  canUpdate,
  isAdmin,
  isDoctor,
  isPatient,
  getRolePermissions
} from '../utils/permissions';

/**
 * Custom hook to check user permissions
 * Provides easy access to permission checking functions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  return {
    // Permission checking functions
    hasPermission: (action, resource) => hasPermission(userRole, action, resource),
    canView: (resource) => canView(userRole, resource),
    canCreate: (resource) => canCreate(userRole, resource),
    canJoin: (resource) => canJoin(userRole, resource),
    canDelete: (resource) => canDelete(userRole, resource),
    canUpdate: (resource) => canUpdate(userRole, resource),

    // Role checking functions
    isAdmin: () => isAdmin(userRole),
    isDoctor: () => isDoctor(userRole),
    isPatient: () => isPatient(userRole),

    // Get all permissions for current user
    getAllPermissions: () => getRolePermissions(userRole),

    // Current user role
    role: userRole
  };
};
