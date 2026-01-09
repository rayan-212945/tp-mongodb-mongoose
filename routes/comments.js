// routes/comments.js
const express = require('express');
const router = express.Router();

const Comment = require('../models/Comment');
const Post = require('../models/Post');

const AUTHOR_FIELDS = 'username avatar firstName lastName fullName';

// Petit helper : si un champ est une string JSON -> on le reconvertit en objet
function safeParseJson(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeCommentsPayload(payload) {
  // payload peut être un array ou un objet unique
  const arr = Array.isArray(payload) ? payload : [payload];

  for (const c of arr) {
    c.author = safeParseJson(c.author);
    c.post = safeParseJson(c.post);
  }

  return Array.isArray(payload) ? arr : arr[0];
}

// GET /api/comments
router.get('/', async (req, res, next) => {
  try {
    const comments = await Comment.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', AUTHOR_FIELDS)
      .populate({
        path: 'post',
        select: 'title author category',
        populate: [
          { path: 'author', select: AUTHOR_FIELDS },
          { path: 'category', select: 'name color' }
        ]
      })
      .lean();

    res.json(normalizeCommentsPayload(comments));
  } catch (err) {
    next(err);
  }
});

// GET /api/comments/:id
router.get('/:id', async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', AUTHOR_FIELDS)
      .populate({
        path: 'post',
        select: 'title author category',
        populate: [
          { path: 'author', select: AUTHOR_FIELDS },
          { path: 'category', select: 'name color' }
        ]
      })
      .lean();

    if (!comment) return res.status(404).json({ error: 'Commentaire non trouvé' });

    res.json(normalizeCommentsPayload(comment));
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    next(err);
  }
});

// POST /api/comments
router.post('/', async (req, res, next) => {
  try {
    const { content, author, post, parentComment } = req.body;

    if (!content || !author || !post) {
      return res.status(400).json({ error: 'content, author et post sont requis' });
    }

    const existingPost = await Post.findById(post);
    if (!existingPost) return res.status(404).json({ error: 'Post associé introuvable' });

    const created = await Comment.create({
      content,
      author,
      post,
      parentComment: parentComment || null
    });

    const populated = await Comment.findById(created._id)
      .populate('author', AUTHOR_FIELDS)
      .populate({
        path: 'post',
        select: 'title author category',
        populate: [
          { path: 'author', select: AUTHOR_FIELDS },
          { path: 'category', select: 'name color' }
        ]
      })
      .lean();

    res.status(201).json(normalizeCommentsPayload(populated));
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    next(err);
  }
});

// PUT /api/comments/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content est requis' });

    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content, isEdited: true },
      { new: true, runValidators: true }
    )
      .populate('author', AUTHOR_FIELDS)
      .populate({
        path: 'post',
        select: 'title author category',
        populate: [
          { path: 'author', select: AUTHOR_FIELDS },
          { path: 'category', select: 'name color' }
        ]
      })
      .lean();

    if (!comment) return res.status(404).json({ error: 'Commentaire non trouvé' });

    res.json(normalizeCommentsPayload(comment));
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    next(err);
  }
});

// DELETE /api/comments/:id (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!comment) return res.status(404).json({ error: 'Commentaire non trouvé' });

    res.json({ message: 'Commentaire marqué comme supprimé (soft delete)' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    next(err);
  }
});

module.exports = router;
