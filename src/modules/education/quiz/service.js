/**
 * Quiz Service — VERSION 100% (All Fixes Included)
 */
const db = require("../../../lib/db");
const AppError = require("../../../lib/AppError");

exports.QuizService = {
  async createQuiz({ title, description, category, questions, authorId }) {
    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      const quizRes = await client.query(
        `INSERT INTO education_quizzes (title, description, category, author_id)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [title, description, category || null, authorId]
      );
      const quiz = quizRes.rows[0];

      for (const q of questions) {
        await client.query(
          `INSERT INTO education_quiz_questions
           (quiz_id, question, options, correct_index)
           VALUES ($1,$2,$3,$4)`,
          [quiz.id, q.question, q.options, q.correctIndex]
        );
      }

      await client.query("COMMIT");
      return quiz;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async listQuizzes({ page = 1, limit = 10, search, category }) {
    const offset = (page - 1) * limit;
    const params = [];
    const where = ["deleted_at IS NULL"];

    if (search) {
      params.push(`%${search}%`);
      where.push(`title ILIKE $${params.length}`);
    }

    if (category) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }

    const query = `
      SELECT *
      FROM education_quizzes
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const items = await db.query(query, params);
    const total = await db.query(
      `SELECT COUNT(*) FROM education_quizzes WHERE ${where.join(" AND ")}`,
      params
    );

    return {
      items: items.rows,
      total: Number(total.rows[0].count),
      page,
      limit,
    };
  },

  async getQuizById(id) {
    const quizRes = await db.query(
      `SELECT *
       FROM education_quizzes
       WHERE id=$1 AND deleted_at IS NULL`,
      [id]
    );
    if (!quizRes.rows.length) throw new AppError("Quiz not found", 404);
    const quiz = quizRes.rows[0];

    // 🔥 FIX #3 — retourner correct_index
    const questionsRes = await db.query(
      `SELECT id, question, options, correct_index
       FROM education_quiz_questions
       WHERE quiz_id=$1
       ORDER BY created_at ASC`,
      [id]
    );

    return {
      ...quiz,
      questions: questionsRes.rows,
    };
  },

  async updateQuiz(id, data, userId) {
    // Vérifier ownership (author_id == userId)
    const quizRes = await db.query(
      `SELECT author_id FROM education_quizzes WHERE id=$1 AND deleted_at IS NULL`,
      [id]
    );
    if (!quizRes.rows.length) throw new AppError("Quiz not found", 404);

    const quiz = quizRes.rows[0];
    if (quiz.author_id !== userId) {
      throw new AppError("Only quiz author can update", 403);
    }

    const fields = [];
    const values = [];
    let i = 1;

    for (const key in data) {
      if (data[key] === undefined) continue;
      fields.push(`${key}=$${i}`);
      values.push(data[key]);
      i++;
    }

    if (!fields.length) {
      throw new AppError("No fields to update", 400);
    }

    values.push(id);

    const result = await db.query(
      `UPDATE education_quizzes
       SET ${fields.join(", ")}, updated_at=NOW()
       WHERE id=$${i} AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (!result.rows.length) throw new AppError("Quiz not found", 404);
    return result.rows[0];
  },

  async deleteQuiz(id, userId) {
    // Vérifier ownership
    const quizRes = await db.query(
      `SELECT author_id FROM education_quizzes WHERE id=$1 AND deleted_at IS NULL`,
      [id]
    );
    if (!quizRes.rows.length) throw new AppError("Quiz not found", 404);

    const quiz = quizRes.rows[0];
    if (quiz.author_id !== userId) {
      throw new AppError("Only quiz author can delete", 403);
    }

    const result = await db.query(
      `UPDATE education_quizzes
       SET deleted_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );
    if (!result.rows.length) throw new AppError("Quiz not found", 404);
    return result.rows[0];
  },

  async submitAttempt({ quizId, userId, answers }) {
    // Vérifier que le quiz existe et n'est pas supprimé
    const quizRes = await db.query(
      `SELECT id FROM education_quizzes WHERE id=$1 AND deleted_at IS NULL`,
      [quizId]
    );
    if (!quizRes.rows.length) throw new AppError("Quiz not found or deleted", 404);

    const questionsRes = await db.query(
      `SELECT id, correct_index
       FROM education_quiz_questions
       WHERE quiz_id=$1`,
      [quizId]
    );
    const questions = questionsRes.rows;
    if (!questions.length) throw new AppError("Quiz has no questions", 400);

    // 🔥 FIX #2 — map en string pour matcher questionId (string)
    const map = new Map();
    for (const q of questions) {
      map.set(String(q.id), q.correct_index);
    }

    let score = 0;
    const total = questions.length;

    for (const ans of answers) {
      const correctIndex = map.get(String(ans.questionId));
      if (correctIndex === undefined) continue;  // Ignorer silencieusement
      if (ans.selectedIndex === correctIndex) score++;
    }

    const percentage = total > 0 ? (score / total) * 100 : 0;

    // 🔥 FIX #1 — enregistrer answers JSON
    const attemptRes = await db.query(
      `INSERT INTO education_quiz_attempts (quiz_id, user_id, score, total, percentage, answers)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [quizId, userId, score, total, percentage, JSON.stringify(answers)]
    );

    // Émettre événement
    try {
      const eventBus = require("../../../core/eventBus");
      eventBus.emit("quiz.attempt.completed", {
        quizId,
        userId,
        score,
        total,
        percentage,
      });
    } catch (err) {
      // Non-fatal
    }

    return {
      attempt: attemptRes.rows[0],
      score,
      total,
      percentage,
    };
  },

  async getLeaderboard(quizId, limit = 10) {
    const result = await db.query(
      `SELECT
         u.id,
         u.username,
         COUNT(*) as attempts,
         MAX(qa.score) as best_score,
         MAX(qa.percentage) as best_percentage,
         AVG(qa.percentage)::NUMERIC(5,2) as avg_percentage
       FROM education_quiz_attempts qa
       JOIN users u ON qa.user_id = u.id
       WHERE qa.quiz_id=$1 AND u.deleted_at IS NULL
       GROUP BY u.id, u.username
       ORDER BY best_percentage DESC, attempts DESC
       LIMIT $2`,
      [quizId, limit]
    );
    return result.rows;
  },

  async getQuizResultsForUser(userId) {
    const result = await db.query(
      `SELECT
         qa.id,
         qa.quiz_id,
         qa.score,
         qa.total,
         qa.percentage,
         qa.created_at,
         eq.title as quiz_title
       FROM education_quiz_attempts qa
       JOIN education_quizzes eq ON qa.quiz_id = eq.id
       WHERE qa.user_id=$1 AND eq.deleted_at IS NULL
       ORDER BY qa.created_at DESC`,
      [userId]
    );
    return result.rows;
  },
};
