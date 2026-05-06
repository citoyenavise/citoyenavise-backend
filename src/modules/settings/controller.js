/**
 * Settings Controller
 */

const { SettingsService } = require('./service');

const SettingsController = {
  async getAll(req, res, next) {
    try {
      const settings = await SettingsService.getAllSettings();
      return res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  async getSingle(req, res, next) {
    try {
      const value = await SettingsService.getSetting(req.params.key);
      return res.json({ success: true, data: { [req.params.key]: value } });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const result = await SettingsService.setSetting(req.params.key, req.body.value);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = SettingsController;
