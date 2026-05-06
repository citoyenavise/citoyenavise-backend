/**
 * Validation Schemas — Notifications
 */

const { z } = require('zod');

const paginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

const markReadSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  paginationSchema,
  markReadSchema,
};
