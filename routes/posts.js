// routes/posts.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Post = require('../models/Post');
const Comment = require('../models/Comment');

// GET /api/posts/search
router.get('/search', async (req, res, next) => {
  try {
    const { q = '' } = req.query;
    let { page = 1, limit = 10 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Paramètre q requis' });
    }

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    const regex = new RegExp(q, 'i');
    const filter = {
      $or: [
        { title: { $regex: regex } },
        { content: { $regex: regex } },
        { tags: { $in: [regex] } }
      ]
    };

    const totalItems = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data: posts,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/trending
router.get('/trending', async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const trending = await Post.aggregate([
      {
        $match: {
          status: 'published',
          publishedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } }
        }
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$viewCount', 0.3] },
              { $multiply: ['$likesCount', 0.7] }
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 10 }
    ]);

    res.json(trending);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts (filtres + pagination + tri)
router.get('/', async (req, res, next) => {
  try {
    let { page = 1, limit = 10, status, author, category, sort = 'date' } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    const filter = {};
    if (status) filter.status = status;
    if (author) filter.author = author;
    if (category) filter.category = category;

    const totalItems = await Post.countDocuments(filter);

    // tri likes via aggregate
    if (sort === 'likes') {
      const posts = await Post.aggregate([
        { $match: filter },
        { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ]);

      return res.json({
        data: posts,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
        totalItems
      });
    }

    let sortStage = { createdAt: -1 };
    if (sort === 'viewCount') sortStage = { viewCount: -1 };

    const posts = await Post.find(filter)
      .sort(sortStage)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data: posts,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id (viewCount++)
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!post) return res.status(404).json({ error: 'Post non trouvé' });

    res.json(post);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    next(err);
  }
});

// POST /api/posts
router.post('/', async (req, res, next) => {
  try {
    const post = await Post.create(req.body);
    res.status(201).json(post);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    next(err);
  }
});

// PUT /api/posts/:id
router.put('/:id', async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!post) return res.status(404).json({ error: 'Post non trouvé' });

    res.json(post);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    next(err);
  }
});

// DELETE /api/posts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });
    res.json({ message: 'Post supprimé avec succès' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    next(err);
  }
});

// PATCH /api/posts/:id/publish
router.patch('/:id/publish', async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status: 'published', publishedAt: new Date() },
      { new: true }
    );

    if (!post) return res.status(404).json({ error: 'Post non trouvé' });

    res.json({ message: 'Post publié', post });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    next(err);
  }
});

// PATCH /api/posts/:id/like
router.patch('/:id/like', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId requis' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const index = post.likes.findIndex((id) => id.equals(userObjectId));

    let message;
    if (index === -1) {
      post.likes.push(userObjectId);
      message = 'Post liké';
    } else {
      post.likes.splice(index, 1);
      message = 'Like retiré';
    }

    await post.save();

    res.json({ message, likesCount: post.likes.length, post });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    next(err);
  }
});

// GET /api/posts/:id/comments (arbre)
router.get('/:id/comments', async (req, res, next) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate('author', 'username avatar firstName lastName fullName')
      .lean();

    const byId = {};
    comments.forEach((c) => {
      c.replies = [];
      byId[c._id.toString()] = c;
    });

    const roots = [];
    comments.forEach((c) => {
      if (c.parentComment) {
        const parent = byId[c.parentComment.toString()];
        if (parent) parent.replies.push(c);
        else roots.push(c);
      } else {
        roots.push(c);
      }
    });

    res.json(roots);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    next(err);
  }
});

// POST /api/posts/:id/comments
router.post('/:id/comments', async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { content, author, parentComment } = req.body;

    if (!content || !author) {
      return res.status(400).json({ error: 'content et author sont requis' });
    }

    const created = await Comment.create({
      content,
      author,
      post: postId,
      parentComment: parentComment || null
    });

    const populated = await Comment.findById(created._id)
      .populate('author', 'username avatar firstName lastName fullName');

    res.status(201).json(populated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID invalide' });
    next(err);
  }
});

module.exports = router;
