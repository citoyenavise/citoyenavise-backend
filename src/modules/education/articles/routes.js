/**
 * Article Routes - Official
 */
const express = require("express");
const router = express.Router();

const validateRequest = require("../../../middlewares/validateRequest");
const auth = require("../../../middlewares/auth");

const {
  createArticleSchema,
  updateArticleSchema,
  listArticlesSchema,
} = require("./schema");

const { ArticleController } = require("./controller");

// CREATE
router.post(
  "/",
  auth,
  validateRequest(createArticleSchema),
  ArticleController.create
);

// LIST
router.get(
  "/",
  validateRequest(listArticlesSchema),
  ArticleController.list
);

// GET ONE
router.get("/:id", ArticleController.getOne);

// UPDATE
router.put(
  "/:id",
  auth,
  validateRequest(updateArticleSchema),
  ArticleController.update
);

// DELETE
router.delete("/:id", auth, ArticleController.remove);

module.exports = router;
