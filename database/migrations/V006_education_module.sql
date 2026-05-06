-- =========================================
-- Migration V006 - Education Module
-- Date: 2026-05-04
-- Description: Tables pour videos, articles, quiz
-- =========================================

-- =========================================
-- TABLE : education_videos
-- =========================================
CREATE TABLE IF NOT EXISTS education_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(512) NOT NULL,
  category VARCHAR(100) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  duration_seconds INT,
  thumbnail_url VARCHAR(512),
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_education_videos_author_id ON education_videos(author_id);
CREATE INDEX idx_education_videos_category ON education_videos(category);
CREATE INDEX idx_education_videos_status ON education_videos(status);
CREATE INDEX idx_education_videos_created ON education_videos(created_at DESC);
CREATE INDEX idx_education_videos_deleted ON education_videos(deleted_at);

-- =========================================
-- TABLE : education_articles
-- =========================================
CREATE TABLE IF NOT EXISTS education_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_education_articles_author_id ON education_articles(author_id);
CREATE INDEX idx_education_articles_category ON education_articles(category);
CREATE INDEX idx_education_articles_status ON education_articles(status);
CREATE INDEX idx_education_articles_created ON education_articles(created_at DESC);
CREATE INDEX idx_education_articles_deleted ON education_articles(deleted_at);

-- =========================================
-- TABLE : education_quiz
-- =========================================
CREATE TABLE IF NOT EXISTS education_quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  pass_score INT DEFAULT 70,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  attempts_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_education_quiz_author_id ON education_quiz(author_id);
CREATE INDEX idx_education_quiz_category ON education_quiz(category);
CREATE INDEX idx_education_quiz_status ON education_quiz(status);
CREATE INDEX idx_education_quiz_created ON education_quiz(created_at DESC);

-- =========================================
-- TABLE : education_quiz_questions
-- =========================================
CREATE TABLE IF NOT EXISTS education_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES education_quiz(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_education_quiz_questions_quiz_id ON education_quiz_questions(quiz_id);
CREATE INDEX idx_education_quiz_questions_order ON education_quiz_questions(quiz_id, order_index);

-- =========================================
-- TABLE : education_quiz_answers
-- =========================================
CREATE TABLE IF NOT EXISTS education_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES education_quiz_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_education_quiz_answers_question_id ON education_quiz_answers(question_id);

-- =========================================
-- TABLE : education_quiz_results
-- =========================================
CREATE TABLE IF NOT EXISTS education_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES education_quiz(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  max_score INT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  passed BOOLEAN DEFAULT false,
  time_spent_seconds INT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_education_quiz_results_quiz_id ON education_quiz_results(quiz_id);
CREATE INDEX idx_education_quiz_results_user_id ON education_quiz_results(user_id);
CREATE INDEX idx_education_quiz_results_completed ON education_quiz_results(completed_at DESC);
