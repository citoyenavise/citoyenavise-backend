/**
 * Quiz Routes - Official
 */
const express = require("express");
const router = express.Router();

const validateRequest = require("../../../middlewares/validateRequest");
const auth = require("../../../middlewares/auth");

const {
  createQuizSchema,
  updateQuizSchema,
  listQuizzesSchema,
  submitAttemptSchema,
} = require("./schema");

const { QuizController } = require("./controller");

// CREATE
router.post(
  "/",
  auth,
  validateRequest(createQuizSchema),
  QuizController.create
);

// LIST
router.get(
  "/",
  validateRequest(listQuizzesSchema),
  QuizController.list
);

// GET ONE
router.get("/:id", QuizController.getOne);

// UPDATE
router.put(
  "/:id",
  auth,
  validateRequest(updateQuizSchema),
  QuizController.update
);

// DELETE
router.delete("/:id", auth, QuizController.remove);

// SUBMIT ATTEMPT
router.post(
  "/:id/attempts",
  auth,
  validateRequest(submitAttemptSchema),
  QuizController.submitAttempt
);

// GET LEADERBOARD
router.get("/:id/leaderboard", QuizController.getLeaderboard);

module.exports = router;
