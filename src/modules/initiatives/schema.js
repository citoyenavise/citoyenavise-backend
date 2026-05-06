const { z } = require('zod');

const createInitiativeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  goals: z.string().optional(),
  category: z.string().min(2).max(50),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deadline: z.string().datetime().optional(),
});

const updateInitiativeSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).optional(),
  goals: z.string().optional(),
  category: z.string().min(2).max(50).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(['draft', 'active', 'closed', 'archived']).optional(),
});

const listInitiativeSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'active', 'closed', 'archived']).optional(),
  sort: z.enum(['recent', 'popular', 'deadline']).default('recent'),
});

const closeInitiativeSchema = z.object({
  status: z.enum(['closed', 'archived']),
});

module.exports = {
  createInitiativeSchema,
  updateInitiativeSchema,
  listInitiativeSchema,
  closeInitiativeSchema,
};
