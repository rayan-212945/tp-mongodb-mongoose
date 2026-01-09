// models/User.js
const mongoose = require('mongoose');
const { monitorQuery } = require('../middleware/monitoring');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      validate: {
        validator: function (v) {
          // Alphanum + underscore, pas d'espaces
          return /^[a-zA-Z0-9_]+$/.test(v);
        },
        message:
          "Le nom d’utilisateur doit être alphanumérique (underscore autorisé) et sans espaces."
      }
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: 'Email invalide'
      }
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },

    age: {
      type: Number,
      min: 13,
      max: 120,
      validate: {
        validator: function (v) {
          return v === undefined || v === null || Number.isInteger(v);
        },
        message: "L'âge doit être un nombre entier"
      }
    },

    bio: {
      type: String,
      maxlength: 500,
      default: ''
    },

    avatar: {
      type: String,
      default: null,
      validate: {
        validator: function (url) {
          if (!url) return true;
          // On accepte tout URL http/https (svg, querystring, etc.)
          return /^https?:\/\/.+/i.test(url);
        },
        message: "URL d'avatar invalide"
      }
    },

    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// =========================
// Index (TP)
// =========================

userSchema.index({ role: 1, isActive: 1, createdAt: -1 });
userSchema.index({ firstName: 1, lastName: 1 });

// =========================
// Monitoring (TP 6.4)
// =========================
userSchema.pre(/^find/, monitorQuery);
userSchema.pre('findOneAndUpdate', monitorQuery);

// =========================
// Pre-save (TP 5.2) SANS next()
// =========================
userSchema.pre('save', function () {
  // Nettoyage
  if (this.firstName) this.firstName = this.firstName.trim();
  if (this.lastName) this.lastName = this.lastName.trim();

  // Avatar par défaut si absent
  if (!this.avatar || this.avatar === '') {
    const initials =
      `${(this.firstName || '').charAt(0)}${(this.lastName || '').charAt(0)}`.toUpperCase();

    this.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      initials || this.username
    )}`;
  }

  // Hash fake si password modifié
  if (this.isModified('password')) {
    this.password = `HASHED_${this.password}`;
  }
});

// =========================
// Virtual : fullName (TP 1.1)
// =========================
userSchema.virtual('fullName').get(function () {
  // ✅ Sans virgule
  return `${this.firstName} ${this.lastName}`;
});

// =========================
// Méthode d'instance
// =========================
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  return await this.save();
};

module.exports = mongoose.model('User', userSchema);
