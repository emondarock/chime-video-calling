import { useAuth } from '../contexts/AuthContext';

/**
 * Component-level permission guard
 * Shows children only if user has one of the allowed roles
 * 
 * @param {string[]} allowedRoles - Array of roles that can see this component
 * @param {React.ReactNode} children - Content to show if authorized
 * @param {React.ReactNode} fallback - Optional content to show if not authorized
 */
const RoleGuard = ({ allowedRoles = [], children, fallback = null }) => {
  const { user } = useAuth();

  if (!user || !user.role) {
    return fallback;
  }

  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
    return children;
  }

  return fallback;
};

export default RoleGuard;
