/**
 * Validation Schemas — Likes
 */

const { z } = require('zod');

const likeSchema = z.object({
  postId: z.string().uuid(),
});

const unlikeSchema = z.object({
  postId: z.string().uuid(),
});

module.exports = {
  likeSchema,
  unlikeSchema,
};
