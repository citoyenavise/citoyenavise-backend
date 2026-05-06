/**
 * Preferences Service — Préférences de contenu et notifications
 */

const db = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');

class PreferencesService {
  /**
   * Créer ou mettre à jour les préférences
   */
  static async updatePreferences(profileId, data) {
    const result = await db.query(
      `INSERT INTO profile_preferences
       (profile_id, preferred_categories, hide_mature_content, language,
        notification_frequency, email_notifications, push_notifications,
        show_in_discovery, allow_messages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (profile_id)
       DO UPDATE SET
         preferred_categories = COALESCE($2, preferred_categories),
         hide_mature_content = COALESCE($3, hide_mature_content),
         language = COALESCE($4, language),
         notification_frequency = COALESCE($5, notification_frequency),
         email_notifications = COALESCE($6, email_notifications),
         push_notifications = COALESCE($7, push_notifications),
         show_in_discovery = COALESCE($8, show_in_discovery),
         allow_messages = COALESCE($9, allow_messages),
         updated_at = NOW()
       RETURNING *`,
      [
        profileId,
        data.preferredCategories ? JSON.stringify(data.preferredCategories) : null,
        data.hideMaturityContent !== undefined ? data.hideMaturityContent : null,
        data.language || null,
        data.notificationFrequency || null,
        data.emailNotifications !== undefined ? data.emailNotifications : null,
        data.pushNotifications !== undefined ? data.pushNotifications : null,
        data.showInDiscovery !== undefined ? data.showInDiscovery : null,
        data.allowMessages !== undefined ? data.allowMessages : null,
      ]
    );

    return this._formatPreferences(result.rows[0]);
  }

  /**
   * Récupérer les préférences
   */
  static async getPreferences(profileId) {
    const result = await db.query(
      `SELECT * FROM profile_preferences WHERE profile_id = $1`,
      [profileId]
    );

    if (result.rows.length === 0) {
      // Créer les préférences par défaut
      return await this.updatePreferences(profileId, {});
    }

    return this._formatPreferences(result.rows[0]);
  }

  /**
   * Filtrer les contenus basé sur les préférences
   */
  static async filterContentByPreferences(profileId, content) {
    const prefs = await this.getPreferences(profileId);

    // Appliquer les filtres
    if (prefs.hideMaturityContent && content.isMaturity) {
      return null;
    }

    if (prefs.preferredCategories && prefs.preferredCategories.length > 0) {
      if (!prefs.preferredCategories.includes(content.category)) {
        return null;
      }
    }

    return content;
  }

  /**
   * Vérifier si notifications email activées
   */
  static async emailNotificationsEnabled(profileId) {
    const prefs = await this.getPreferences(profileId);
    return prefs.emailNotifications;
  }

  /**
   * Vérifier si notifications push activées
   */
  static async pushNotificationsEnabled(profileId) {
    const prefs = await this.getPreferences(profileId);
    return prefs.pushNotifications;
  }

  /**
   * Obtenir la langue préférée
   */
  static async getPreferredLanguage(profileId) {
    const prefs = await this.getPreferences(profileId);
    return prefs.language || 'fr';
  }

  static _formatPreferences(p) {
    return {
      profileId: p.profile_id,
      preferredCategories: p.preferred_categories || [],
      hideMaturityContent: p.hide_mature_content,
      language: p.language,
      notificationFrequency: p.notification_frequency,
      emailNotifications: p.email_notifications,
      pushNotifications: p.push_notifications,
      showInDiscovery: p.show_in_discovery,
      allowMessages: p.allow_messages,
      updatedAt: p.updated_at,
    };
  }
}

module.exports = { PreferencesService };
