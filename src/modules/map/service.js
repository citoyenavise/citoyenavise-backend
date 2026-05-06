/**
 * Service carte interactive (GeoJSON)
 */

const { v4: uuidv4 } = require('uuid');
const { query } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const logger = require('../../core/utils/logger');

/**
 * Récupérer nœuds dans une bbox (GeoJSON)
 */
async function getNodesInBbox(west, south, east, north, limit = 200) {
  const maxLimit = Math.min(limit, 500);

  // PostGIS query pour requête spatial
  const result = await query(
    `SELECT n.id, n.name, n.profile_id, n.node_type, n.latitude, n.longitude,
            n.category, n.description, n.url,
            pr.user_id, u.username, pr.avatar_url, pr.interests,
            pr.followers_count, pr.posts_count
     FROM map_nodes n
     LEFT JOIN profiles pr ON n.profile_id = pr.id
     LEFT JOIN users u ON pr.user_id = u.id
     WHERE n.visibility = 'public'
       AND ST_DWithin(
         ST_SetSRID(ST_Point(n.longitude, n.latitude), 4326),
         ST_SetSRID(ST_MakeEnvelope($1, $2, $3, $4, 4326), 4326),
         0
       )
     LIMIT $5`,
    [west, south, east, north, maxLimit]
  );

  // Formater en GeoJSON
  const features = result.rows.map(row => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [row.longitude, row.latitude],
    },
    properties: {
      id: row.id,
      name: row.name,
      profileId: row.profile_id,
      nodeType: row.node_type,
      category: row.category,
      description: row.description,
      url: row.url,
      username: row.username,
      avatarUrl: row.avatar_url,
      interests: row.interests,
      followersCount: row.followers_count,
      postsCount: row.posts_count,
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Récupérer nœuds par région
 */
async function getNodesByRegion(province, limit = 200) {
  const maxLimit = Math.min(limit, 500);

  const result = await query(
    `SELECT n.id, n.name, n.profile_id, n.node_type, n.latitude, n.longitude,
            n.category, u.username, pr.avatar_url
     FROM map_nodes n
     LEFT JOIN profiles pr ON n.profile_id = pr.id
     LEFT JOIN users u ON pr.user_id = u.id
     WHERE n.visibility = 'public' AND n.province = $1
     LIMIT $2`,
    [province, maxLimit]
  );

  const features = result.rows.map(row => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [row.longitude, row.latitude],
    },
    properties: {
      id: row.id,
      name: row.name,
      profileId: row.profile_id,
      nodeType: row.node_type,
      username: row.username,
      avatarUrl: row.avatar_url,
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Créer nœud (admin)
 */
async function createNode({ profileId, name, description, latitude, longitude, province, municipality, category, url, visibility = 'public' }) {
  const nodeId = uuidv4();

  const result = await query(
    `INSERT INTO map_nodes (id, profile_id, name, description, latitude, longitude, province, municipality, category, url, visibility, node_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'citizen')
     RETURNING *`,
    [nodeId, profileId, name, description, latitude, longitude, province, municipality, category, url, visibility]
  );

  logger.info('Map node created', { meta: { nodeId, name } });
  return result.rows[0];
}

/**
 * Mettre à jour nœud (admin)
 */
async function updateNode(nodeId, data) {
  const updates = [];
  const params = [nodeId];
  let paramIndex = 2;

  const updateableFields = ['name', 'description', 'latitude', 'longitude', 'province', 'municipality', 'category', 'url', 'visibility'];

  for (const field of updateableFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      params.push(data[field]);
      paramIndex += 1;
    }
  }

  if (updates.length === 0) {
    return query('SELECT * FROM map_nodes WHERE id = $1', [nodeId]);
  }

  updates.push('updated_at = NOW()');
  const sql = `UPDATE map_nodes SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;

  const result = await query(sql, params);
  logger.info('Map node updated', { meta: { nodeId } });

  return result.rows[0];
}

/**
 * Supprimer nœud (admin)
 */
async function deleteNode(nodeId) {
  await query('DELETE FROM map_nodes WHERE id = $1', [nodeId]);
  logger.info('Map node deleted', { meta: { nodeId } });
}

module.exports = {
  getNodesInBbox,
  getNodesByRegion,
  createNode,
  updateNode,
  deleteNode,
};
