const express = require('express');
const router = express.Router({ mergeParams: true });
const voteController = require('./controller');
const { authRequired, authOptional } = require('../../../core/middleware/auth');
const { asyncHandler } = require('../../../core/middleware/errorHandler');

// List voters (public)
router.get('/', authOptional, asyncHandler((req, res, next) => voteController.listVoters(req, res, next)));

// Get vote status (optionally authenticated)
router.get('/status', authOptional, asyncHandler((req, res, next) => voteController.getVoteStatus(req, res, next)));

// Add vote (protected)
router.post('/', authRequired, asyncHandler((req, res, next) => voteController.addVote(req, res, next)));

// Remove vote (protected)
router.delete('/', authRequired, asyncHandler((req, res, next) => voteController.removeVote(req, res, next)));

module.exports = router;
