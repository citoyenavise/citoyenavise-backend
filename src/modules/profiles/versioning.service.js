/**
 * Profile Versioning Service — Audit trail et historique
 */

const db = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');

class ProfileVersioningService {
  /**
   * Enregistrer une modification de profil
   */
  static async logChange(profileId, fieldName, oldValue, newValue, changedBy = null, reason = null) {
    await db.query(
      `INSERT INTO profile_versions (profile_id, field_name, old_value, new_value, changed_by, change_reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        profileId,
        fieldName,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        changedBy,
        reason,
      ]
    );
  }

  /**
   * Récupérer l'historique complet d'un profil
   */
  static async getVersionHistory(profileId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT pv.id, pv.field_name as fieldName, pv.old_value as oldValue, pv.new_value as newValue,
              pv.changed_by as changedBy, pv.change_reason as changeReason, pv.changed_at as changedAt,
              u.username
       FROM profile_versions pv
       LEFT JOIN users u ON pv.changed_by = u.id
       WHERE pv.profile_id = $1
       ORDER BY pv.changed_at DESC
       LIMIT $2 OFFSET $3`,
      [profileId, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM profile_versions WHERE profile_id = $1`,
      [profileId]
    );

    return {
      versions: result.rows.map(v => ({
        id: v.id,
        fieldName: v.fieldName,
        oldValue: v.oldValue ? JSON.parse(v.oldValue) : null,
        newValue: v.newValue ? JSON.parse(v.newValue) : null,
        changedBy: v.changedBy,
        changedByUsername: v.username,
        changeReason: v.changeReason,
        changedAt: v.changedAt,
      })),
      pagination: {
        total: parseInt(countResult.rows[0].count, 10),
        limit,
        offset,
      },
    };
  }

  /**
   * Récupérer les modifications d'un champ spécifique
   */
  static async getFieldHistory(profileId, fieldName, limit = 20, offset = 0) {
    const result = await db.query(
      `SELECT pv.id, pv.old_value as oldValue, pv.new_value as newValue,
              pv.changed_by as changedBy, pv.change_reason as changeReason, pv.changed_at as changedAt,
              u.username
       FROM profile_versions pv
       LEFT JOIN users u ON pv.changed_by = u.id
       WHERE pv.profile_id = $1 AND pv.field_name = $2
       ORDER BY pv.changed_at DESC
       LIMIT $3 OFFSET $4`,
      [profileId, fieldName, limit, offset]
    );

    return result.rows.map(v => ({
      id: v.id,
      oldValue: v.oldValue ? JSON.parse(v.oldValue) : null,
      newValue: v.newValue ? JSON.parse(v.newValue) : null,
      changedBy: v.changedBy,
      changedByUsername: v.username,
      changeReason: v.changeReason,
      changedAt: v.changedAt,
    }));
  }

  /**
   * Récupérer les modifications récentes
   */
  static async getRecentChanges(limit = 50) {
    const result = await db.query(
      `SELECT pv.id, pv.profile_id as profileId, pv.field_name as fieldName,
              pv.changed_at as changedAt, u.username
       FROM profile_versions pv
       LEFT JOIN users u ON pv.changed_by = u.id
       ORDER BY pv.changed_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Comparer deux versions d'un profil
   */
  static async compareVersions(versionId1, versionId2) {
    const v1Result = await db.query(
      `SELECT * FROM profile_versions WHERE id = $1`,
      [versionId1]
    );

    const v2Result = await db.query(
      `SELECT * FROM profile_versions WHERE id = $1`,
      [versionId2]
    );

    if (v1Result.rows.length === 0 || v2Result.rows.length === 0) {
      throw new AppError('Version not found', 404);
    }

    return {
      version1: v1Result.rows[0],
      version2: v2Result.rows[0],
    };
  }
}

module.exports = { ProfileVersioningService };
