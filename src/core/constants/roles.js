/**
 * User Roles Constants
 */

const ROLES = {
  CITIZEN: 'citizen',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

const ROLE_HIERARCHY = {
  citizen: 0,
  moderator: 10,
  admin: 100,
  super_admin: 1000,
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
};
