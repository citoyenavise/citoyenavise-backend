-- =========================================
-- Migration V010 - Quiz Tables (Simplified Schema)
-- Date: 2026-05-04
-- Description: Simplified quiz tables for education_quizzes module
-- =========================================

-- Main quizzes table
CREATE TABLE IF NOT EXISTS education_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_education_quizzes_author_id ON education_quizzes(author_id);
CREATE INDEX idx_education_quizzes_category ON education_quizzes(category);
CREATE INDEX idx_education_quizzes_created ON education_quizzes(created_at DESC);
CREATE INDEX idx_education_quizzes_deleted ON education_quizzes(deleted_at);

-- Quiz questions with options
CREATE TABLE IF NOT EXISTS education_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES education_quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_education_quiz_questions_quiz_id ON education_quiz_questions(quiz_id);

-- Quiz attempts/results
CREATE TABLE IF NOT EXISTS education_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES education_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  total INT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  answers JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_education_quiz_attempts_quiz_id ON education_quiz_attempts(quiz_id);
CREATE INDEX idx_education_quiz_attempts_user_id ON education_quiz_attempts(user_id);
CREATE INDEX idx_education_quiz_attempts_created ON education_quiz_attempts(created_at DESC);
