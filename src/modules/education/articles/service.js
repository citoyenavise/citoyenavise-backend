/**
 * Article Service - Official
 */
const db = require("../../../lib/db");
const AppError = require("../../../lib/AppError");

exports.ArticleService = {
  async createArticle({ title, content, category, tags, authorId }) {
    const result = await db.query(
      `INSERT INTO education_articles (title, content, category, tags, author_id)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [title, content, category || null, tags || null, authorId]
    );
    return result.rows[0];
  },

  async listArticles({ page = 1, limit = 10, search, category }) {
    const offset = (page - 1) * limit;
    const params = [];
    const where = ["deleted_at IS NULL"];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length})`);
    }

    if (category) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }

    params.push(limit);
    params.push(offset);

    const query = `
      SELECT * FROM education_articles
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const items = await db.query(query, params);
    const total = await db.query(
      `SELECT COUNT(*) FROM education_articles WHERE ${where.join(" AND ")}`,
      params.slice(0, -2)
    );

    return {
      items: items.rows,
      total: Number(total.rows[0].count),
      page,
      limit,
    };
  },

  async getArticleById(id) {
    const result = await db.query(
      `SELECT * FROM education_articles
       WHERE id=$1 AND deleted_at IS NULL`,
      [id]
    );
    if (!result.rows.length) throw new AppError("Article not found", 404);
    return result.rows[0];
  },

  async incrementViews(id) {
    await db.query(
      `UPDATE education_articles
       SET views_count = views_count + 1
       WHERE id=$1`,
      [id]
    );
  },

  async updateArticle(id, data) {
    const fields = [];
    const values = [];
    let i = 1;

    for (const key in data) {
      fields.push(`${key}=$${i}`);
      values.push(data[key]);
      i++;
    }

    values.push(id);

    const result = await db.query(
      `UPDATE education_articles
       SET ${fields.join(", ")}, updated_at=NOW()
       WHERE id=$${i} AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (!result.rows.length) throw new AppError("Article not found", 404);
    return result.rows[0];
  },

  async deleteArticle(id) {
    const result = await db.query(
      `UPDATE education_articles
       SET deleted_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );
    if (!result.rows.length) throw new AppError("Article not found", 404);
    return result.rows[0];
  },

  async getLikesCount(id) {
    const result = await db.query(
      `SELECT COUNT(*) FROM likes
       WHERE target_id=$1 AND type='article'`,
      [id]
    );
    return Number(result.rows[0].count);
  },
};
