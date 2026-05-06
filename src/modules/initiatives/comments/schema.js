const { z } = require('zod');

const createCommentSchema = z.object({
  content: z.string().min(3, 'Comment must be at least 3 characters').max(5000),
});

const updateCommentSchema = z.object({
  content: z.string().min(3, 'Comment must be at least 3 characters').max(5000),
});

const listCommentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['recent', 'popular']).default('recent'),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
  listCommentsSchema,
};
