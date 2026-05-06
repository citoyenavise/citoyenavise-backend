/**
 * Admin Routes
 */

const express = require("express");
const router = express.Router();

const auth = require("../../middlewares/auth");
const { requirePermission } = require("../../middlewares/adminAuth");
const validateRequest = require("../../middlewares/validateRequest");

const { PERMISSIONS } = require("./permissions");
const { createListUsersSchema, updateRoleSchema, banUserSchema } = require("./schema");
const { AdminController } = require("./controller");

// List users
router.get(
  "/users",
  auth,
  requirePermission(PERMISSIONS.VIEW_USERS),
  validateRequest(createListUsersSchema),
  AdminController.listUsers
);

// Update user role
router.put(
  "/users/:id/role",
  auth,
  requirePermission(PERMISSIONS.EDIT_ROLES),
  validateRequest(updateRoleSchema),
  AdminController.updateRole
);

// Ban user
router.put(
  "/users/:id/ban",
  auth,
  requirePermission(PERMISSIONS.BAN_USERS),
  validateRequest(banUserSchema),
  AdminController.banUser
);

// Unban user
router.put(
  "/users/:id/unban",
  auth,
  requirePermission(PERMISSIONS.BAN_USERS),
  AdminController.unbanUser
);

// Delete post
router.delete(
  "/posts/:id",
  auth,
  requirePermission(PERMISSIONS.DELETE_CONTENT),
  (req, res, next) => {
    req.params.table = "post";
    AdminController.deleteContent(req, res, next);
  }
);

// Restore post
router.post(
  "/posts/:id/restore",
  auth,
  requirePermission(PERMISSIONS.RESTORE_CONTENT),
  (req, res, next) => {
    req.params.table = "post";
    AdminController.restoreContent(req, res, next);
  }
);

// Delete article
router.delete(
  "/articles/:id",
  auth,
  requirePermission(PERMISSIONS.DELETE_CONTENT),
  (req, res, next) => {
    req.params.table = "article";
    AdminController.deleteContent(req, res, next);
  }
);

// Restore article
router.post(
  "/articles/:id/restore",
  auth,
  requirePermission(PERMISSIONS.RESTORE_CONTENT),
  (req, res, next) => {
    req.params.table = "article";
    AdminController.restoreContent(req, res, next);
  }
);

// Delete video
router.delete(
  "/videos/:id",
  auth,
  requirePermission(PERMISSIONS.DELETE_CONTENT),
  (req, res, next) => {
    req.params.table = "video";
    AdminController.deleteContent(req, res, next);
  }
);

// Restore video
router.post(
  "/videos/:id/restore",
  auth,
  requirePermission(PERMISSIONS.RESTORE_CONTENT),
  (req, res, next) => {
    req.params.table = "video";
    AdminController.restoreContent(req, res, next);
  }
);

// Stats overview
router.get(
  "/stats/overview",
  auth,
  requirePermission(PERMISSIONS.VIEW_STATS),
  AdminController.stats
);

module.exports = router;
