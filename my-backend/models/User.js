
const mongoose = require('mongoose');

/* ── STUDY PROFILE SCHEMA ───────────────────────── */

const profileUserSchema = new mongoose.Schema({

  fullName: {
    type: String,
    required: true
  },

  college: {
    type: String,
    required: true
  },

  branch: {
    type: String,
    required: true
  },

  semester: {
    type: String,
    required: true
  },

  subjects: {
    type: [String],
    required: true
  },

  availability: {
    type: String,
    required: true
  },

  mode: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

/* ── AUTH SCHEMA ────────────────────────────────── */

const authUserSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

/* ── EXPORT MODELS ──────────────────────────────── */

const ProfileUser =
  mongoose.model('ProfileUser', profileUserSchema);

const AuthUser =
  mongoose.model('AuthUser', authUserSchema);

module.exports = {
  ProfileUser,
  AuthUser
};

