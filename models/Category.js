const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  postCount: {
    type: Number,
    default: 0
  }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
