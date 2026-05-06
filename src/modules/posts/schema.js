/**
 * Validation Schemas — Posts
 */

const { z } = require('zod');

const VALID_TYPES = ['idea', 'proposal', 'question', 'discussion'];
const VALID_CATEGORIES = ['élections', 'gouvernement', 'droits', 'services', 'santé', 'éducation', 'environnement', 'économie', 'autres'];

const createPostSchema = z.object({
  title: z.string().min(5).max(255),
  content: z.string().min(20).max(5000),
  type: z.enum(VALID_TYPES),
  category: z.enum(VALID_CATEGORIES),
});

const updatePostSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  content: z.string().min(20).max(5000).optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
});

const listSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  category: z.enum(VALID_CATEGORIES).optional(),
  type: z.enum(VALID_TYPES).optional(),
  sort: z.enum(['latest', 'popular']).default('latest'),
  userId: z.string().uuid().optional(),
});

const flagSchema = z.object({
  reason: z.string().min(5).max(500),
});

const PopularQuerySchema = z.object({
  range: z.enum(['daily', 'weekly', 'monthly', 'all']).default('daily'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  sort: z.enum(['score', 'likes', 'comments']).default('score'),
});

module.exports = {
  VALID_TYPES,
  VALID_CATEGORIES,
  createPostSchema,
  updatePostSchema,
  listSchema,
  flagSchema,
  PopularQuerySchema,
};
