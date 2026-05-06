/**
 * Schémas de validation - Module Videos
 */

const { z } = require('zod');

// =========================================
// CREATE VIDEO SCHEMA
// =========================================
const createVideoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  url: z.string().url('Invalid URL format'),
  category: z.string().min(1, 'Category is required'),
  duration: z.number().positive('Duration must be greater than 0'),
  tags: z.array(z.string()).optional(),
});

// =========================================
// UPDATE VIDEO SCHEMA
// =========================================
const updateVideoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  url: z.string().url('Invalid URL format').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  duration: z.number().positive('Duration must be greater than 0').optional(),
  tags: z.array(z.string()).optional(),
});

// =========================================
// LIST VIDEOS FILTERS
// =========================================
const listVideoSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'trending']).default('latest'),
});

module.exports = {
  createVideoSchema,
  updateVideoSchema,
  listVideoSchema,
};
