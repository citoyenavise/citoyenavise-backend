/**
 * Article Schemas avec wrappers body/query
 */
const { z } = require("zod");

exports.createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    content: z.string().min(10),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

exports.updateArticleSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    content: z.string().min(10).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

exports.listArticlesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
  }),
});
