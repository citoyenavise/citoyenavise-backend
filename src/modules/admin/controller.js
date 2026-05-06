/**
 * Admin Controller — HTTP handlers for admin operations
 */

const { AdminService } = require("./service");
const { createListUsersSchema, updateRoleSchema, banUserSchema } = require("./schema");

exports.AdminController = {
  async listUsers(req, res, next) {
    try {
      const { page, limit, role, banned, search, from, to } = req.query;
      
      const result = await AdminService.listUsers({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        role,
        banned: banned === "true",
        search,
        from,
        to,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await AdminService.updateRole(id, role, req.user.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async banUser(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const user = await AdminService.banUser(id, reason, req.user.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async unbanUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await AdminService.unbanUser(id, req.user.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async deleteContent(req, res, next) {
    try {
      const { table, id } = req.params;

      const content = await AdminService.deleteContent(table, id, req.user.id);
      res.json(content);
    } catch (err) {
      next(err);
    }
  },

  async restoreContent(req, res, next) {
    try {
      const { table, id } = req.params;

      const content = await AdminService.restoreContent(table, id, req.user.id);
      res.json(content);
    } catch (err) {
      next(err);
    }
  },

  async stats(req, res, next) {
    try {
      const stats = await AdminService.statsOverview();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },
};
