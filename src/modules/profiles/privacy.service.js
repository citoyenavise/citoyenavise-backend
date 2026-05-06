/**
 * Privacy Service — Gestion de la visibilité et confidentialité des profils
 */

const db = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');

class PrivacyService {
  /**
   * Mettre à jour les paramètres de confidentialité
   */
  static async updatePrivacy(profileId, data) {
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (data.profileVisibility !== undefined) {
      updateFields.push(`profile_visibility = $${paramIndex}`);
      params.push(data.profileVisibility);
      paramIndex++;
    }

    if (data.showLocation !== undefined) {
      updateFields.push(`show_location = $${paramIndex}`);
      params.push(data.showLocation);
      paramIndex++;
    }

    if (data.showStats !== undefined) {
      updateFields.push(`show_stats = $${paramIndex}`);
      params.push(data.showStats);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(profileId);

    const result = await db.query(
      `UPDATE profiles
       SET ${updateFields.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('Profile not found', 404);
    }

    return this._formatProfile(result.rows[0]);
  }

  /**
   * Vérifier l'accès à un profil selon sa visibilité
   */
  static async canViewProfile(profileId, viewerId = null) {
    const result = await db.query(
      `SELECT p.profile_visibility, p.user_id
       FROM profiles p
       WHERE p.user_id = $1`,
      [profileId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const profile = result.rows[0];

    // Public → accessible à tous
    if (profile.profile_visibility === 'public') {
      return true;
    }

    // Private → accessible seulement au propriétaire
    if (profile.profile_visibility === 'private') {
      return viewerId === profile.user_id;
    }

    // Followers → accessible seulement si follower
    if (profile.profile_visibility === 'followers') {
      if (viewerId === profile.user_id) return true;
      if (!viewerId) return false;

      const followResult = await db.query(
        `SELECT 1 FROM follows
         WHERE follower_id = $1 AND following_id = $2`,
        [viewerId, profile.user_id]
      );

      return followResult.rows.length > 0;
    }

    return false;
  }

  /**
   * Récupérer les paramètres de confidentialité
   */
  static async getPrivacy(profileId) {
    const result = await db.query(
      `SELECT profile_visibility, show_location, show_stats
       FROM profiles
       WHERE user_id = $1`,
      [profileId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Profile not found', 404);
    }

    return result.rows[0];
  }

  static _formatProfile(p) {
    return {
      profileVisibility: p.profile_visibility,
      showLocation: p.show_location,
      showStats: p.show_stats,
      updatedAt: p.updated_at,
    };
  }
}

module.exports = { PrivacyService };
