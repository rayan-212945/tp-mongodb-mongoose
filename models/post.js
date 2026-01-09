// models/Post.js
const mongoose = require('mongoose');
const Category = require('./Category');
const Comment = require('./Comment');
const { monitorQuery } = require('../middleware/monitoring');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      validate: {
        validator: function (title) {
          // Lettres (accents), chiffres, espaces uniquement
          return /^[0-9A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(title);
        },
        message: 'Le titre ne doit pas contenir de caractères spéciaux.'
      }
    },
    content: {
      type: String,
      required: true,
      minlength: 10
    },
    excerpt: {
      type: String,
      maxlength: 300,
      default: ''
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    tags: {
      type: [String],
      validate: [
        {
          validator: function (tags) {
            if (!tags) return true;
            return tags.length <= 10;
          },
          message: 'Maximum 10 tags autorisés.'
        },
        {
          validator: function (tags) {
            if (!tags) return true;
            return tags.every((tag) => tag.length <= 20);
          },
          message: 'Chaque tag doit contenir au maximum 20 caractères.'
        }
      ],
      set: function (tags) {
        if (!tags) return tags;
        return tags.map((t) => t.trim());
      }
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    viewCount: {
      type: Number,
      default: 0
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    publishedAt: {
      type: Date,
      default: null
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index (TP)
postSchema.index({ title: 'text', content: 'text', tags: 'text' });
postSchema.index({ author: 1, status: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1, viewCount: -1 });
postSchema.index(
  { featured: 1, viewCount: -1 },
  { partialFilterExpression: { status: 'published' } }
);

// Monitoring
postSchema.pre(/^find/, monitorQuery);

// ✅ Auto-populate author + category (avec firstName/lastName pour fullName)
postSchema.pre(/^find/, function () {
  this.populate('author', 'username avatar firstName lastName fullName')
      .populate('category', 'name color');
});

// Pre-save SANS next()
postSchema.pre('save', function () {
  if (this.isModified('content') && (!this.excerpt || this.excerpt.trim() === '')) {
    this.excerpt = this.content.substring(0, 100);
  }

  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

// Post-save : incrémenter postCount
postSchema.post('save', async function (doc) {
  if (doc.category) {
    await Category.findByIdAndUpdate(doc.category, { $inc: { postCount: 1 } });
  }
});

// Post-delete : supprimer commentaires + décrémenter postCount
postSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;

  await Comment.deleteMany({ post: doc._id });

  if (doc.category) {
    await Category.findByIdAndUpdate(doc.category, { $inc: { postCount: -1 } });
  }
});

module.exports = mongoose.model('Post', postSchema);
