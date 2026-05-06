/**
 * Media Schema
 */

const { z } = require('zod');

const UploadSchema = z.object({
  file: z.any().optional(),
  type: z.enum(['image', 'video', 'document']),
  description: z.string().max(500).optional(),
});

module.exports = { UploadSchema };
