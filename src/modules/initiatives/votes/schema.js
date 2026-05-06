const { z } = require('zod');

const createVoteSchema = z.object({
  // Vote action - just mark the intent
});

const listVotesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

module.exports = {
  createVoteSchema,
  listVotesSchema,
};
