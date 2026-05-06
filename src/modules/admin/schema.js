/**
 * Admin Schemas
 */

const { z } = require("zod");
const { ROLES } = require("./permissions");

exports.createListUsersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    role: z.enum([ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN]).optional(),
    banned: z.string().optional(),
    search: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

exports.updateRoleSchema = z.object({
  body: z.object({
    role: z.enum([ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN]),
  }),
});

exports.banUserSchema = z.object({
  body: z.object({
    reason: z.string().min(3),
  }),
});

exports.paginationSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
