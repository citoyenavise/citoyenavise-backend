/**
 * Validation Schemas — Popular System
 */

const { z } = require('zod');

const PopularQuerySchema = z.object({
  range: z.enum(['daily', 'weekly', 'monthly', 'all']).default('daily'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  sort: z.enum(['score', 'likes', 'comments']).default('score'),
});

module.exports = {
  PopularQuerySchema,
};
