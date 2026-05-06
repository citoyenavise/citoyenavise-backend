/**
 * Quiz Schemas avec wrappers body/query
 */
const { z } = require("zod");

exports.createQuizSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    category: z.string().optional(),
    questions: z.array(
      z.object({
        // tu peux garder "question" ou renommer partout en "statement" si tu veux
        question: z.string().min(3),
        options: z.array(z.string().min(1)).min(2),
        correctIndex: z.number().int().min(0),
      })
    ).min(1),
  }),
});

exports.updateQuizSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    category: z.string().optional(),
  }),
});

exports.listQuizzesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
  }),
});

exports.submitAttemptSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        // string pour matcher ce qui vient souvent du frontend
        questionId: z.string().min(1),
        selectedIndex: z.number().int().min(0),
      })
    ).min(1),
  }),
});
