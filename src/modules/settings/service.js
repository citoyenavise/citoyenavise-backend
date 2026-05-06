/**
 * Settings Service — System-wide configuration
 */

const { query } = require('../../core/services/database');

class SettingsService {
  static async getSetting(key) {
    const result = await query(
      `SELECT value FROM system_settings WHERE key = $1`,
      [key]
    );
    return result.rows[0]?.value || null;
  }

  static async setSetting(key, value) {
    const result = await query(
      `INSERT INTO system_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value)]
    );
    return result.rows[0];
  }

  static async getAllSettings() {
    const result = await query(`SELECT key, value FROM system_settings`);
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = JSON.parse(row.value);
    });
    return settings;
  }

  static async initializeDefaults() {
    const defaults = {
      maintenance_mode: false,
      api_rate_limit: 1000,
      max_upload_size: 500 * 1024 * 1024,
      feature_flags: {
        quiz_enabled: true,
        initiatives_enabled: true,
        feed_enabled: true,
      },
    };

    for (const [key, value] of Object.entries(defaults)) {
      await this.setSetting(key, value);
    }
  }
}

module.exports = { SettingsService };
