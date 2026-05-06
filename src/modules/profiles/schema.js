/**
 * Profiles Schemas — Zod validation pour toutes les fonctionnalités étendues
 */

const { z } = require('zod');

// ===== PRIVACY / CONFIDENTIALITÉ =====
exports.privacySchema = z.object({
  body: z.object({
    profileVisibility: z.enum(['public', 'private', 'followers']),
    showLocation: z.boolean().optional(),
    showStats: z.boolean().optional(),
  }),
});

// ===== PREFERENCES / CONTENU =====
exports.preferencesSchema = z.object({
  body: z.object({
    preferredCategories: z.array(z.string()).optional(),
    hideMaturityContent: z.boolean().optional(),
    language: z.string().length(2).optional(),
    notificationFrequency: z.enum(['never', 'daily', 'weekly', 'instant']).optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    showInDiscovery: z.boolean().optional(),
    allowMessages: z.boolean().optional(),
  }),
});

// ===== DYNAMIC FIELDS =====
exports.dynamicFieldSchema = z.object({
  body: z.object({
    fieldKey: z.string().min(1).max(100),
    fieldValue: z.string().optional(),
    visibility: z.enum(['public', 'private', 'followers']).optional(),
  }),
});

exports.dynamicFieldsUpdateSchema = z.object({
  body: z.object({
    fields: z.array(
      z.object({
        fieldKey: z.string().min(1),
        fieldValue: z.string().optional(),
        visibility: z.enum(['public', 'private', 'followers']).optional(),
      })
    ),
  }),
});

// ===== FIELD DEFINITIONS (Admin) =====
exports.fieldDefinitionSchema = z.object({
  body: z.object({
    fieldKey: z.string().min(1).max(100).regex(/^[a-z_]+$/),
    fieldName: z.string().min(1).max(255),
    fieldType: z.enum(['text', 'textarea', 'number', 'boolean', 'select', 'multiselect', 'url', 'email']),
    fieldDescription: z.string().optional(),
    isVisibleInProfile: z.boolean().optional(),
    isSearchable: z.boolean().optional(),
    validationRules: z.record(z.any()).optional(),
    displayOrder: z.number().int().optional(),
  }),
});

// ===== SEARCH AVANCÉE =====
exports.advancedSearchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    location: z.string().optional(),
    badges: z.string().optional(),
    reputationMin: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
    categories: z.string().optional(),
    verifiedOnly: z.string().optional().transform(v => v === 'true'),
    sort: z.enum(['relevance', 'reputation', 'recent']).optional().default('recent'),
    page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
    limit: z.string().optional().transform(v => v ? Math.min(parseInt(v, 10), 100) : 20),
  }),
});

// ===== BADGES =====
exports.badgeSchema = z.object({
  body: z.object({
    badgeType: z.string().min(1).max(100),
    badgeName: z.string().min(1).max(255),
    badgeDescription: z.string().optional(),
    badgeIconUrl: z.string().url().optional(),
  }),
});

// ===== REPUTATION EVENTS =====
exports.reputationEventSchema = z.object({
  body: z.object({
    eventType: z.string().min(1).max(50),
    points: z.number().int(),
    description: z.string().optional(),
    sourceId: z.string().uuid().optional(),
    sourceType: z.string().optional(),
  }),
});

// ===== PAGINATION & SEARCH =====
exports.paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
    limit: z.string().optional().transform(v => v ? Math.min(parseInt(v, 10), 100) : 20),
  }),
});

// ===== VERSIONS =====
exports.versionsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
    limit: z.string().optional().transform(v => v ? Math.min(parseInt(v, 10), 50) : 20),
  }),
});
