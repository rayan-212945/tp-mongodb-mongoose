const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Category = require('../models/Category');

router.get('/dashboard', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      activeUsers,
      postsByStatus,
      topCategories,
      mostCommented,
      activity
    ] = await Promise.all([

      // 1️⃣ Utilisateurs actifs
      User.countDocuments({ isActive: true }),

      // 2️⃣ Posts par statut
      Post.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // 3️⃣ Top 5 catégories
      Post.aggregate([
        { $match: { category: { $ne: null } } },
        {
          $group: {
            _id: '$category',
            totalPosts: { $sum: 1 }
          }
        },
        { $sort: { totalPosts: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $project: {
            _id: 0,
            name: '$category.name',
            color: '$category.color',
            totalPosts: 1
          }
        }
      ]),

      // 4️⃣ Posts les plus commentés
      Comment.aggregate([
        {
          $group: {
            _id: '$post',
            commentsCount: { $sum: 1 }
          }
        },
        { $sort: { commentsCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: '_id',
            as: 'post'
          }
        },
        { $unwind: '$post' },
        {
          $project: {
            _id: 0,
            title: '$post.title',
            comments: '$commentsCount'
          }
        }
      ]),

      // 5️⃣ Activité des 30 derniers jours
      Post.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            posts: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      activeUsers,
      postsByStatus,
      topCategories,
      mostCommented,
      activityLast30Days: activity
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
