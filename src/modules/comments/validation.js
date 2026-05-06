/**
 * Validation Schemas — Comments (version corrigée)
 */

const { z } = require('zod');

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string()
    .trim()
    .min(3, 'Le commentaire est trop court')
    .max(5000, 'Le commentaire est trop long'),
});

const updateCommentSchema = z.object({
  content: z.string()
    .trim()
    .min(3, 'Le commentaire est trop court')
    .max(5000, 'Le commentaire est trop long'),
});

const getCommentsSchema = z.object({
  postId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  sort: z.enum(['latest', 'popular']).default('latest'),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
  getCommentsSchema,
};
