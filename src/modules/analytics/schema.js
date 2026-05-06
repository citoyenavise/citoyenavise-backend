const { z } = require('zod');

const trackEventSchema = z.object({
  type: z.enum(['view', 'click', 'search', 'initiative_view', 'video_view', 'article_view']),
  targetId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

const statsQuerySchema = z.object({
  range: z.enum(['24h', '7d', '30d', 'all']).default('7d'),
});

module.exports = {
  trackEventSchema,
  statsQuerySchema,
};
