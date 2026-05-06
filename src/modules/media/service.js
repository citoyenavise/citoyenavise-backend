/**
 * Media Service — File uploads and processing
 */

const db = require('../../lib/db');
const fs = require('fs');
const path = require('path');

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  document: ['application/pdf', 'application/msword', 'text/plain'],
};

const MAX_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
  document: 50 * 1024 * 1024, // 50MB
};

class MediaService {
  static async upload({ userId, file, type, description }) {
    // Validate MIME type
    if (!ALLOWED_TYPES[type] || !ALLOWED_TYPES[type].includes(file.mimetype)) {
      throw new Error(`Invalid MIME type for ${type}`);
    }

    // Validate size
    if (file.size > MAX_SIZES[type]) {
      throw new Error(`File too large for ${type}`);
    }

    // Save file metadata to DB
    const filename = `${Date.now()}-${file.originalname}`;
    const result = await db.query(
      `INSERT INTO media (user_id, filename, type, size, mimetype, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'processing')
       RETURNING *`,
      [userId, filename, type, file.size, file.mimetype, description || null]
    );

    const media = result.rows[0];

    // Store file (async, non-blocking)
    // In production, use S3, GCS, or similar
    const uploadDir = path.join(__dirname, '../../../uploads', type);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFile(filePath, file.buffer, (err) => {
      if (err) {
        console.error('File write error:', err);
        // Mark as failed
        db.query('UPDATE media SET status = $1 WHERE id = $2', ['failed', media.id]);
      } else {
        // Mark as ready
        db.query('UPDATE media SET status = $1 WHERE id = $2', ['ready', media.id]);
      }
    });

    return media;
  }

  static async getMedia(mediaId) {
    const result = await db.query(
      `SELECT * FROM media WHERE id = $1`,
      [mediaId]
    );
    return result.rows[0] || null;
  }

  static async deleteMedia(mediaId, userId) {
    const media = await this.getMedia(mediaId);
    if (!media) throw new Error('Media not found');
    if (media.user_id !== userId) throw new Error('Unauthorized');

    await db.query('UPDATE media SET deleted_at = NOW() WHERE id = $1', [mediaId]);

    // Delete file (async)
    const filePath = path.join(__dirname, '../../../uploads', media.type, media.filename);
    fs.unlink(filePath, (err) => {
      if (err) console.error('File deletion error:', err);
    });

    return media;
  }
}

module.exports = { MediaService };
