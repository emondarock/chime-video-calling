/**
 * Role-based permission rules
 * Defines what each role can do in the application
 */

export const PERMISSIONS = {
  patient: {
    canView: ['own-appointments', 'own-profile'],
    canCreate: [],
    canJoin: ['own-meetings'],
    canDelete: [],
    canUpdate: ['own-profile']
  },
  doctor: {
    canView: ['own-appointments', 'patient-details', 'own-profile'],
    canCreate: ['appointments'],
    canJoin: ['own-meetings'],
    canDelete: ['own-appointments'],
    canUpdate: ['own-appointments', 'own-profile']
  },
  'hospital-admin': {
    canView: ['all-hospital-appointments', 'patient-details', 'doctor-details', 'analytics'],
    canCreate: ['appointments', 'users'],
    canJoin: ['all-meetings'],
    canDelete: ['hospital-appointments', 'users'],
    canUpdate: ['hospital-appointments', 'users']
  },
  'department-admin': {
    canView: ['department-appointments', 'patient-details', 'doctor-details'],
    canCreate: ['appointments'],
    canJoin: ['department-meetings'],
    canDelete: ['department-appointments'],
    canUpdate: ['department-appointments']
  }
};

/**
 * Check if a user has a specific permission
 * @param {string} userRole - The user's role
 * @param {string} action - The action to check (canView, canCreate, canJoin, canDelete, canUpdate)
 * @param {string} resource - The resource being accessed
 * @returns {boolean}
 */
export const hasPermission = (userRole, action, resource) => {
  if (!userRole || !PERMISSIONS[userRole]) {
    return false;
  }

  const rolePermissions = PERMISSIONS[userRole][action];
  if (!rolePermissions) {
    return false;
  }

  return rolePermissions.includes(resource);
};

/**
 * Check if user can view a specific resource
 */
export const canView = (userRole, resource) => {
  return hasPermission(userRole, 'canView', resource);
};

/**
 * Check if user can create a specific resource
 */
export const canCreate = (userRole, resource) => {
  return hasPermission(userRole, 'canCreate', resource);
};

/**
 * Check if user can join meetings
 */
export const canJoin = (userRole, resource) => {
  return hasPermission(userRole, 'canJoin', resource);
};

/**
 * Check if user can delete a specific resource
 */
export const canDelete = (userRole, resource) => {
  return hasPermission(userRole, 'canDelete', resource);
};

/**
 * Check if user can update a specific resource
 */
export const canUpdate = (userRole, resource) => {
  return hasPermission(userRole, 'canUpdate', resource);
};

/**
 * Check if user has admin role (hospital or department admin)
 */
export const isAdmin = (userRole) => {
  return userRole === 'hospital-admin' || userRole === 'department-admin';
};

/**
 * Check if user is a doctor
 */
export const isDoctor = (userRole) => {
  return userRole === 'doctor';
};

/**
 * Check if user is a patient
 */
export const isPatient = (userRole) => {
  return userRole === 'patient';
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (userRole) => {
  return PERMISSIONS[userRole] || null;
};
