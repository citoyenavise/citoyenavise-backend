/**
 * Ideas Schema - Validation Zod
 */

const { z } = require('zod');

const createIdeaSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10).max(5000),
  category: z.string().min(2).max(100),
  type: z.enum(['idea', 'proposal', 'question']),
});

const updateIdeaSchema = createIdeaSchema.partial();

module.exports = {
  createIdeaSchema,
  updateIdeaSchema,
};
