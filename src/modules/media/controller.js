/**
 * Media Controller
 */

const { MediaService } = require('./service');

const MediaController = {
  async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const media = await MediaService.upload({
        userId: req.user.id,
        file: req.file,
        type: req.body.type,
        description: req.body.description,
      });

      return res.status(201).json({ success: true, data: media });
    } catch (err) {
      next(err);
    }
  },

  async getMedia(req, res, next) {
    try {
      const media = await MediaService.getMedia(req.params.id);
      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }
      return res.json({ success: true, data: media });
    } catch (err) {
      next(err);
    }
  },

  async deleteMedia(req, res, next) {
    try {
      await MediaService.deleteMedia(req.params.id, req.user.id);
      return res.json({ success: true, message: 'Media deleted' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = MediaController;
