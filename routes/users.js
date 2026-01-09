// routes/users.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');   // IMPORTANT : nom du fichier avec majuscule
const Post = require('../models/Post');   // pour /:id/posts et /:id/stats

// 1. GET /api/users - Lister tous les utilisateurs
router.get('/', async (req, res, next) => {
  try {
    let { page = 1, limit = 10, sort = 'createdAt', role } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    const filter = {};
    if (role) {
      filter.role = role;
    }

    const totalItems = await User.countDocuments(filter);

    const users = await User.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password');

    res.json({
      data: users,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET /api/users/:id - Obtenir un utilisateur par ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    next(err);
  }
});

// 3. POST /api/users - Créer un utilisateur
router.post('/', async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json(userObj);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        error: 'Conflit de clé unique',
        details: err.keyValue
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    next(err);
  }
});

// 4. PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    if (err.code === 11000) {
      return res.status(400).json({
        error: 'Conflit de clé unique',
        details: err.keyValue
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Données invalides', details: err.errors });
    }
    next(err);
  }
});

// 5. DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    next(err);
  }
});

// 6. PATCH /api/users/:id/toggle-active - Activer/désactiver un utilisateur
router.patch('/:id/toggle-active', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.isActive = !user.isActive;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      message: 'Statut mis à jour',
      user: userObj
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    next(err);
  }
});

// 3.1 - GET /api/users/:id/posts - Obtenir tous les posts d'un utilisateur
router.get('/:id/posts', async (req, res, next) => {
  try {
    const userId = req.params.id;

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate('category', 'name color');

    res.json(posts);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    next(err);
  }
});

// 4.1.3 - GET /api/users/:id/stats - Statistiques utilisateur
router.get('/:id/stats', async (req, res, next) => {
  try {
    const userId = req.params.id;

    const stats = await Post.aggregate([
      {
        $match: {
          author: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } }
        }
      },
      {
        $group: {
          _id: '$author',
          totalPosts: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          avgViews: { $avg: '$viewCount' },
          totalLikes: { $sum: '$likesCount' }
        }
      },
      {
        $project: {
          _id: 0,
          totalPosts: 1,
          totalViews: 1,
          avgViews: { $round: ['$avgViews', 2] },
          totalLikes: 1
        }
      }
    ]);

    if (!stats || stats.length === 0) {
      return res.json({
        totalPosts: 0,
        totalViews: 0,
        avgViews: 0,
        totalLikes: 0
      });
    }

    res.json(stats[0]);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    next(error);
  }
});

module.exports = router;
