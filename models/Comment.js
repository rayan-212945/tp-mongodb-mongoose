// models/Comment.js
const mongoose = require('mongoose');
const { monitorQuery } = require('../middleware/monitoring');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
      validate: {
        validator: function (value) {
          const links = value.match(/https?:\/\/[^\s]+/g);
          return !links || links.length <= 3;
        },
        message: 'Le commentaire contient trop de liens (maximum 3 autorisés).'
      }
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isEdited: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ author: 1, createdAt: -1 });

// Monitoring
commentSchema.pre(/^find/, monitorQuery);

// ✅ Soft delete filter SANS next()
commentSchema.pre(/^find/, function () {
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('Comment', commentSchema);
