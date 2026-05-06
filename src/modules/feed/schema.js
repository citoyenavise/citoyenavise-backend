/**
 * Feed Schema — Validation for feed endpoints
 */

const { z } = require('zod');

const GetFeedSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

module.exports = {
  GetFeedSchema,
};
