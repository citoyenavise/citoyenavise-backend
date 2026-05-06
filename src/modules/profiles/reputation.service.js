/**
 * Reputation Service — Système de réputation et badges
 */

const db = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');

class ReputationService {
  /**
   * Ajouter un événement de réputation
   */
  static async addReputationEvent(profileId, eventType, points, description = null, sourceId = null, sourceType = null) {
    await db.query(
      `INSERT INTO reputation_events (profile_id, event_type, points, description, source_id, source_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [profileId, eventType, points, description, sourceId, sourceType]
    );

    // Recalculer la réputation
    await this.calculateReputation(profileId);
  }

  /**
   * Calculer le score de réputation
   */
  static async calculateReputation(profileId) {
    const result = await db.query(
      `SELECT COALESCE(SUM(points), 0) as total_reputation
       FROM reputation_events
       WHERE profile_id = $1`,
      [profileId]
    );

    const totalReputation = result.rows[0].total_reputation;

    // Mettre à jour le score
    await db.query(
      `UPDATE profiles
       SET reputation_score = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [totalReputation, profileId]
    );

    return totalReputation;
  }

  /**
   * Assigner des badges basé sur la réputation
   */
  static async assignBadges(profileId) {
    const repResult = await db.query(
      `SELECT reputation_score FROM profiles WHERE user_id = $1`,
      [profileId]
    );

    if (repResult.rows.length === 0) {
      throw new AppError('Profile not found', 404);
    }

    const reputation = repResult.rows[0].reputation_score;
    const badges = [];

    // Badges basés sur la réputation
    if (reputation >= 100) {
      badges.push({ type: 'contributor', name: 'Contributeur', description: 'Réputation >= 100' });
    }
    if (reputation >= 500) {
      badges.push({ type: 'influencer', name: 'Influenceur', description: 'Réputation >= 500' });
    }
    if (reputation >= 1000) {
      badges.push({ type: 'leader', name: 'Leader', description: 'Réputation >= 1000' });
    }

    // Insérer les badges
    for (const badge of badges) {
      await db.query(
        `INSERT INTO profile_badges (profile_id, badge_type, badge_name, badge_description)
         SELECT $1, $2, $3, $4
         WHERE NOT EXISTS (
           SELECT 1 FROM profile_badges
           WHERE profile_id = $1 AND badge_type = $2
         )`,
        [profileId, badge.type, badge.name, badge.description]
      );
    }

    return badges;
  }

  /**
   * Récupérer les badges d'un profil
   */
  static async getBadges(profileId) {
    const result = await db.query(
      `SELECT id, badge_type as type, badge_name as name, badge_description as description,
              badge_icon_url as iconUrl, earned_at as earnedAt
       FROM profile_badges
       WHERE profile_id = $1
       ORDER BY earned_at DESC`,
      [profileId]
    );

    return result.rows;
  }

  /**
   * Récupérer l'historique de réputation
   */
  static async getReputationEvents(profileId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT id, event_type as eventType, points, description, source_id as sourceId,
              source_type as sourceType, created_at as createdAt
       FROM reputation_events
       WHERE profile_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [profileId, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM reputation_events WHERE profile_id = $1`,
      [profileId]
    );

    return {
      events: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Récupérer le score de réputation
   */
  static async getReputation(profileId) {
    const result = await db.query(
      `SELECT reputation_score FROM profiles WHERE user_id = $1`,
      [profileId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Profile not found', 404);
    }

    return result.rows[0].reputation_score;
  }
}

module.exports = { ReputationService };
