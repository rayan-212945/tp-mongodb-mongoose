const express = require('express');
const router = express.Router();

const Post = require('../models/Post');
const Category = require('../models/Category');

// GET /api/categories/:id/posts
// - Obtenir tous les posts d'une catégorie
router.get('/:id/posts', async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    // Vérifie que la catégorie existe
    const category = await Category.findById(categoryId).select('name color');
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    const posts = await Post.find({ category: categoryId })
      .sort({ createdAt: -1 });

    res.json({
      category,
      totalPosts: posts.length,
      posts
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    next(err);
  }
});

module.exports = router;
