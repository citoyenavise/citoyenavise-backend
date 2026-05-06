/**
 * Admin Service — User management, content moderation, stats
 */

const { query } = require('../../core/services/database');
const AppError = require('../../core/errors');
const { AdminAuditService } = require('./audit.service');

const CONTENT_TABLES = {
  post: 'posts',
  article: 'education_articles',
  video: 'education_videos',
  quiz: 'education_quizzes',
};

exports.AdminService = {
  async listUsers({ page = 1, limit = 20, role, banned, search, from, to }) {
    const offset = (page - 1) * limit;
    const params = [];
    const where = [];

    if (role) {
      params.push(role);
      where.push(`role = $${params.length}`);
    }

    if (banned !== undefined) {
      params.push(banned);
      where.push(`banned_at ${banned ? 'IS NOT NULL' : 'IS NULL'}`);
    }

    if (search) {
      params.push(`%${search}%`);
      where.push(`(email ILIKE $${params.length} OR username ILIKE $${params.length})`);
    }

    if (from) {
      params.push(new Date(from));
      where.push(`created_at >= $${params.length}`);
    }

    if (to) {
      params.push(new Date(to));
      where.push(`created_at <= $${params.length}`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const itemsRes = await query(
      `SELECT id, username, email, role, banned_at, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countRes = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );

    const total = Number(countRes.rows[0].count);

    return {
      items: itemsRes.rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  async updateRole(userId, newRole, adminId) {
    const result = await query(
      `UPDATE users
       SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, role`,
      [newRole, userId]
    );

    if (!result.rows.length) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    await AdminAuditService.logAction({
      adminId,
      action: 'UPDATE_ROLE',
      targetType: 'user',
      targetId: userId,
      metadata: { newRole },
    });

    return result.rows[0];
  },

  async banUser(userId, reason, adminId) {
    const result = await query(
      `UPDATE users
       SET banned_at = NOW(), ban_reason = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, banned_at`,
      [reason, userId]
    );

    if (!result.rows.length) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    await AdminAuditService.logAction({
      adminId,
      action: 'BAN_USER',
      targetType: 'user',
      targetId: userId,
      metadata: { reason },
    });

    return result.rows[0];
  },

  async unbanUser(userId, adminId) {
    const result = await query(
      `UPDATE users
       SET banned_at = NULL, ban_reason = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING id, username, email, banned_at`,
      [userId]
    );

    if (!result.rows.length) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    await AdminAuditService.logAction({
      adminId,
      action: 'UNBAN_USER',
      targetType: 'user',
      targetId: userId,
    });

    return result.rows[0];
  },

  async deleteContent(table, contentId, adminId) {
    if (!CONTENT_TABLES[table]) {
      throw new AppError('Type de contenu invalide', 400);
    }

    const tableName = CONTENT_TABLES[table];

    const result = await query(
      `UPDATE ${tableName}
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [contentId]
    );

    if (!result.rows.length) {
      throw new AppError('Contenu non trouvé', 404);
    }

    await AdminAuditService.logAction({
      adminId,
      action: 'DELETE_CONTENT',
      targetType: table,
      targetId: contentId,
    });

    return result.rows[0];
  },

  async restoreContent(table, contentId, adminId) {
    if (!CONTENT_TABLES[table]) {
      throw new AppError('Type de contenu invalide', 400);
    }

    const tableName = CONTENT_TABLES[table];

    const result = await query(
      `UPDATE ${tableName}
       SET deleted_at = NULL, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING *`,
      [contentId]
    );

    if (!result.rows.length) {
      throw new AppError('Contenu non trouvé ou déjà restauré', 404);
    }

    await AdminAuditService.logAction({
      adminId,
      action: 'RESTORE_CONTENT',
      targetType: table,
      targetId: contentId,
    });

    return result.rows[0];
  },

  async statsOverview() {
    const userRes = await query(`SELECT COUNT(*) FROM users`);
    const bannedRes = await query(`SELECT COUNT(*) FROM users WHERE banned_at IS NOT NULL`);
    const rolesRes = await query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );

    const postsRes = await query(`SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL`);
    const articlesRes = await query(`SELECT COUNT(*) FROM education_articles WHERE deleted_at IS NULL`);
    const videosRes = await query(`SELECT COUNT(*) FROM education_videos WHERE deleted_at IS NULL`);
    const quizzesRes = await query(`SELECT COUNT(*) FROM education_quizzes WHERE deleted_at IS NULL`);

    const roleDistribution = rolesRes.rows.reduce((acc, row) => {
      acc[row.role] = Number(row.count);
      return acc;
    }, {});

    return {
      users: {
        total: Number(userRes.rows[0].count),
        banned: Number(bannedRes.rows[0].count),
        byRole: roleDistribution,
      },
      content: {
        posts: Number(postsRes.rows[0].count),
        articles: Number(articlesRes.rows[0].count),
        videos: Number(videosRes.rows[0].count),
        quizzes: Number(quizzesRes.rows[0].count),
      },
    };
  },
};
