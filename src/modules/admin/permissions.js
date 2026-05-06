/**
 * Admin Permissions — Système de rôles et permissions
 */

const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
};

const PERMISSIONS = {
  VIEW_USERS: 'view_users',
  EDIT_ROLES: 'edit_roles',
  BAN_USERS: 'ban_users',
  DELETE_CONTENT: 'delete_content',
  RESTORE_CONTENT: 'restore_content',
  VIEW_AUDIT: 'view_audit',
  MANAGE_REPORTS: 'manage_reports',
  VIEW_STATS: 'view_stats',
  EDIT_SETTINGS: 'edit_settings',
};

const ROLE_PERMISSIONS = {
  [ROLES.USER]: [],
  [ROLES.MODERATOR]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.BAN_USERS,
    PERMISSIONS.DELETE_CONTENT,
    PERMISSIONS.RESTORE_CONTENT,
    PERMISSIONS.VIEW_AUDIT,
    PERMISSIONS.MANAGE_REPORTS,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_ROLES,
    PERMISSIONS.BAN_USERS,
    PERMISSIONS.DELETE_CONTENT,
    PERMISSIONS.RESTORE_CONTENT,
    PERMISSIONS.VIEW_AUDIT,
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.VIEW_STATS,
    PERMISSIONS.EDIT_SETTINGS,
  ],
};

function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
};
