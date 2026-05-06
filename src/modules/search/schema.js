const { z } = require('zod');

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Query is required').max(255),
  type: z.enum(['post', 'initiative', 'article', 'video', 'profile']).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sort: z.enum(['relevance', 'date', 'popularity']).default('relevance'),
});

const reindexSchema = z.object({
  type: z.enum(['post', 'initiative', 'article', 'video', 'profile', 'all']).default('all'),
});

module.exports = {
  searchQuerySchema,
  reindexSchema,
};
