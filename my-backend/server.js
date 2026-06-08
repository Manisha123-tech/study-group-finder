
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());


/* ── MONGODB CONNECTION ───────────────────────────── */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Connection error:', err));

/* ── PROFILE USER SCHEMA ─────────────────────────── */

const profileUserSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true
  },

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

const ProfileUser = mongoose.model('ProfileUser', profileUserSchema);

/* ── AUTH USER SCHEMA ────────────────────────────── */

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

const AuthUser = mongoose.model('AuthUser', authUserSchema);

/* ── JWT MIDDLEWARE ──────────────────────────────── */

function verifyToken(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized — no token provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch {

    return res.status(401).json({
      error: 'Unauthorized — invalid or expired token'
    });

  }

}

/* ── SIGNUP ROUTE ────────────────────────────────── */

app.post('/api/auth/signup', async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    const existing = await AuthUser.findOne({ email });

    if (existing) {
      return res.status(400).json({
        error: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new AuthUser({
      email,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.status(201).json({
      token,
      email: user.email
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

/* ── LOGIN ROUTE ─────────────────────────────────── */

app.post('/api/auth/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await AuthUser.findOne({ email });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.json({
      token,
      email: user.email
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

/* ── SAVE PROFILE ────────────────────────────────── */

app.post('/api/users', verifyToken, async (req, res) => {

  try {

    const email = req.user.email;

    const profile = await ProfileUser.findOneAndUpdate(

      { email },

      { ...req.body, email },

      {
        upsert: true,
        new: true,
        runValidators: true
      }

    );

    res.status(201).json(profile);

  } catch (err) {

    res.status(400).json({
      error: err.message
    });

  }

});

/* ── GET ALL USERS ───────────────────────────────── */

app.get('/api/users', verifyToken, async (req, res) => {

  try {

    const users = await ProfileUser.find();

    res.json(users);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// GET CURRENT USER PROFILE

app.get('/api/my-profile', verifyToken, async (req, res) => {

  try {

    const email = req.user.email;

    const user = await ProfileUser.findOne({ email });

    res.json(user);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

/* ── DELETE USER ─────────────────────────────────── */

app.delete('/api/users/:id', verifyToken, async (req, res) => {

  try {

    await ProfileUser.findByIdAndDelete(req.params.id);

    res.json({
      message: 'User deleted'
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});




// ═══════════════════════════════════════════════════════
// PASTE THIS BLOCK into server.js
// LOCATION: paste it right BEFORE the line that says:
//   /* ── START SERVER ────────────────────────────────── */
// ═══════════════════════════════════════════════════════

/* ── CONNECTION SCHEMA ───────────────────────────────── */

const connectionSchema = new mongoose.Schema({
  fromEmail: { type: String, required: true },
  fromName:  { type: String, required: true },
  toEmail:   { type: String, required: true },
  status:    { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

// Prevents duplicate requests between the same two users
connectionSchema.index({ fromEmail: 1, toEmail: 1 }, { unique: true });

const Connection = mongoose.model('Connection', connectionSchema);

/* ── SEND CONNECTION REQUEST ─────────────────────────── */

app.post('/api/connections/send', verifyToken, async (req, res) => {
  try {
    const fromEmail = req.user.email;
    const { toEmail } = req.body;

    if (!toEmail)
      return res.status(400).json({ error: 'toEmail is required' });
    if (fromEmail === toEmail)
      return res.status(400).json({ error: 'You cannot connect with yourself' });

    // Check if request already exists in either direction
    const existing = await Connection.findOne({
      $or: [
        { fromEmail, toEmail },
        { fromEmail: toEmail, toEmail: fromEmail },
      ],
    });

    if (existing) {
  // If previously rejected, delete it and allow a fresh request
  if (existing.status === 'rejected') {
    await Connection.findByIdAndDelete(existing._id);
    // falls through to create a new request below
  } else {
    const msg =
      existing.status === 'accepted' ? 'You are already connected' :
                                       'Request already sent';
    return res.status(409).json({ error: msg, status: existing.status });
  }
}

    // Get sender's name from their profile
    const senderProfile = await ProfileUser.findOne({ email: fromEmail });
    const fromName = senderProfile ? senderProfile.fullName : fromEmail;

    const conn = await new Connection({ fromEmail, fromName, toEmail }).save();
    res.status(201).json({ message: 'Request sent', connection: conn });

  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: 'Request already sent' });
    res.status(500).json({ error: err.message });
  }
});

/* ── GET INCOMING PENDING REQUESTS ──────────────────── */

app.get('/api/connections/incoming', verifyToken, async (req, res) => {
  try {
    const requests = await Connection.find({
      toEmail: req.user.email,
      status: 'pending',
    }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET ALL MY CONNECTIONS (any status) ─────────────── */

app.get('/api/connections/my', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const connections = await Connection.find({
      $or: [{ fromEmail: email }, { toEmail: email }],
    });
    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── ACCEPT OR REJECT A REQUEST ──────────────────────── */

app.patch('/api/connections/:id/respond', verifyToken, async (req, res) => {
  try {
    const { action } = req.body;

    if (!['accepted', 'rejected'].includes(action))
      return res.status(400).json({ error: 'action must be "accepted" or "rejected"' });

    const conn = await Connection.findById(req.params.id);
    if (!conn)
      return res.status(404).json({ error: 'Request not found' });
    if (conn.toEmail !== req.user.email)
      return res.status(403).json({ error: 'Not authorized' });
    if (conn.status !== 'pending')
      return res.status(400).json({ error: 'Already responded' });

    conn.status = action;
    await conn.save();
    res.json({ message: `Request ${action}`, connection: conn });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const chatRoutes = require('./chat-routes');
app.use('/api/chat', chatRoutes);

/* ── START SERVER ────────────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`🚀 Server running on port ${PORT}`);

});


