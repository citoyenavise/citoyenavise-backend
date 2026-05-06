/**
 * Contrôleur carte (GeoJSON) — Version standardisée
 */

const { z } = require('zod');
const mapService = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');

const bboxSchema = z.object({
  bounds: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/, 'Format: west,south,east,north').optional(),
  west: z.coerce.number().optional(),
  south: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
  north: z.coerce.number().optional(),
  region: z.string().length(2).optional(),
  limit: z.coerce.number().default(200),
});

const createNodeSchema = z.object({
  profileId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  province: z.string().length(2).optional(),
  municipality: z.string().optional(),
  category: z.string().optional(),
  url: z.string().url().optional(),
  visibility: z.enum(['public', 'private']).default('public'),
});

async function getNodes(req, res) {
  const validated = bboxSchema.safeParse(req.query);

  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Invalid query parameters',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  let geojson;

  // Si bounds fournis, parser
  if (validated.data.bounds) {
    const [west, south, east, north] = validated.data.bounds.split(',').map(Number);
    geojson = await mapService.getNodesInBbox(west, south, east, north, validated.data.limit);
  } else if (validated.data.region) {
    geojson = await mapService.getNodesByRegion(validated.data.region, validated.data.limit);
  } else if (validated.data.west !== undefined && validated.data.south !== undefined && validated.data.east !== undefined && validated.data.north !== undefined) {
    geojson = await mapService.getNodesInBbox(validated.data.west, validated.data.south, validated.data.east, validated.data.north, validated.data.limit);
  } else {
    throw new AppError(
      'BAD_REQUEST',
      400,
      'Bbox or region required',
      { example: '?bounds=-74,45,-73,46 or ?region=QC' }
    );
  }

  res.apiSuccess(geojson);
}

async function createNode(req, res) {
  const validated = createNodeSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Validation failed',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const node = await mapService.createNode(validated.data);
  res.apiCreated(node);
}

async function updateNode(req, res) {
  const { id } = req.params;
  const validated = createNodeSchema.partial().safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Validation failed',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const node = await mapService.updateNode(id, validated.data);
  res.apiUpdated(node);
}

async function deleteNode(req, res) {
  const { id } = req.params;
  await mapService.deleteNode(id);
  res.apiDeleted(id);
}

module.exports = {
  getNodes,
  createNode,
  updateNode,
  deleteNode,
};
