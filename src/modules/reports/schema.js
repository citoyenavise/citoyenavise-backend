/**
 * Reports Schema — Zod validation for reports module
 */

const { z } = require('zod');

const CreateReportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user', 'content']),
  targetId: z.string().uuid(),
  reason: z.string().min(10).max(500),
  description: z.string().max(1000).optional(),
});

const ListReportsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['open', 'under_review', 'resolved', 'dismissed']).optional(),
  targetType: z.enum(['post', 'comment', 'user', 'content']).optional(),
  sort: z.enum(['created_at', 'updated_at', 'priority']).default('created_at'),
});

const ResolveReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  action: z.enum(['none', 'warn', 'suspend', 'ban']).optional(),
  notes: z.string().max(500).optional(),
});

module.exports = {
  CreateReportSchema,
  ListReportsSchema,
  ResolveReportSchema,
};
