/**
 * Contrôleur posts & idées — version corrigée avec format standardisé
 */

const postsService = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');
const {
  createPostSchema,
  updatePostSchema,
  listSchema,
  flagSchema,
  PopularQuerySchema,
} = require('./schema');

async function listPosts(req, res) {
  const validated = listSchema.safeParse(req.query);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Invalid query parameters',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const result = await postsService.listPosts(validated.data);
  if (result.data && Array.isArray(result.data)) {
    res.apiPaginated(result.data, result.meta.total, result.meta.page, result.meta.limit);
  } else {
    res.apiSuccess(result);
  }
}

async function getPost(req, res) {
  const { id } = req.params;
  const post = await postsService.getPost(id);

  if (!post) {
    throw new AppError('NOT_FOUND', 404, 'Post not found');
  }

  res.apiSuccess(post);
}

async function createPost(req, res) {
  const validated = createPostSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Validation failed',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const post = await postsService.createPost(req.user.userId, validated.data);
  res.apiCreated(post);
}

async function updatePost(req, res) {
  const { id } = req.params;
  const validated = updatePostSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Validation failed',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const post = await postsService.updatePost(id, validated.data, req.user.userId);
  res.apiUpdated(post);
}

async function deletePost(req, res) {
  const { id } = req.params;
  await postsService.deletePost(id, req.user.userId);
  res.apiDeleted(id);
}

async function flagPost(req, res) {
  const validated = flagSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Validation failed',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const { id } = req.params;
  await postsService.flagPost(id, validated.data.reason, req.user.userId);
  res.apiSuccess({ flagged: true });
}

async function likePost(req, res) {
  const { id } = req.params;
  await postsService.likePost(id, req.user.userId);
  res.apiCreated({ liked: true });
}

async function unlikePost(req, res) {
  const { id } = req.params;
  await postsService.unlikePost(id, req.user.userId);
  res.apiSuccess({ unliked: true });
}

async function getPopularPosts(req, res) {
  const validated = PopularQuerySchema.safeParse(req.query);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      422,
      'Invalid query parameters',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const result = await postsService.getPopularPosts(validated.data);
  if (result.data && Array.isArray(result.data)) {
    res.apiPaginated(result.data, result.meta.total, result.meta.page, result.meta.limit);
  } else {
    res.apiSuccess(result);
  }
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  flagPost,
  likePost,
  unlikePost,
  getPopularPosts,
};
