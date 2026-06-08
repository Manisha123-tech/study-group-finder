
// my-backend/chat-routes.js — REPLACE existing file
//
// Added: POST /api/chat/:profileId/upload  (multer file upload)
// Everything else unchanged.
//
// Run once: npm install multer  (inside my-backend/)

const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const Message  = require('./models/Message');

// ── Auth middleware ────────────────────────────────────────────────────────────
function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Reuse existing models ──────────────────────────────────────────────────────
let Connection;
try { Connection = mongoose.model('Connection'); }
catch { Connection = mongoose.model('Connection', new mongoose.Schema({}, { strict: false })); }

let ProfileUser;
try { ProfileUser = mongoose.model('ProfileUser'); }
catch { ProfileUser = mongoose.model('ProfileUser', new mongoose.Schema({}, { strict: false })); }

async function usersAreConnected(emailA, emailB) {
  const doc = await Connection.findOne({
    $or: [
      { fromEmail: emailA, toEmail: emailB, status: 'accepted' },
      { fromEmail: emailB, toEmail: emailA, status: 'accepted' },
    ],
  });
  return !!doc;
}

// ── Multer setup — saves files to my-backend/uploads/ ─────────────────────────
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|ppt|pptx|xls|xlsx/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) ||
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('File type not allowed'));
  },
});

// ── Serve uploaded files statically ───────────────────────────────────────────
// Add this line in server.js:  app.use('/uploads', express.static(path.join(__dirname, 'my-backend/uploads')));
// OR it's handled below via the router — works either way.
router.use('/files', express.static(UPLOAD_DIR));

// ── GET /api/chat/:profileId  – load message history ──────────────────────────
router.get('/:profileId', protect, async (req, res) => {
  try {
    const myEmail = req.user.email;
    const otherProfile = await ProfileUser.findById(req.params.profileId);
    if (!otherProfile) return res.status(404).json({ error: 'User not found' });
    const otherEmail = otherProfile.email;

    if (!(await usersAreConnected(myEmail, otherEmail)))
      return res.status(403).json({ error: 'Not connected with this user' });

    const messages = await Message.find({
      $or: [
        { senderEmail: myEmail,    receiverEmail: otherEmail },
        { senderEmail: otherEmail, receiverEmail: myEmail    },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('[chat] GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/chat/:profileId  – send a text message ──────────────────────────
router.post('/:profileId', protect, async (req, res) => {
  try {
    const myEmail = req.user.email;
    const content = req.body.content?.trim();
    if (!content) return res.status(400).json({ error: 'Empty message' });

    const otherProfile = await ProfileUser.findById(req.params.profileId);
    if (!otherProfile) return res.status(404).json({ error: 'User not found' });
    const otherEmail = otherProfile.email;

    if (!(await usersAreConnected(myEmail, otherEmail)))
      return res.status(403).json({ error: 'Not connected with this user' });

    const myProfile  = await ProfileUser.findOne({ email: myEmail });
    const senderName = myProfile ? myProfile.fullName : myEmail;

    const msg = await Message.create({
      senderEmail: myEmail, senderName,
      receiverEmail: otherEmail,
      content, type: 'text',
    });
    res.status(201).json(msg);
  } catch (err) {
    console.error('[chat] POST error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/chat/:profileId/upload  – send a file ───────────────────────────
router.post('/:profileId/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const myEmail = req.user.email;

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const otherProfile = await ProfileUser.findById(req.params.profileId);
    if (!otherProfile) return res.status(404).json({ error: 'User not found' });
    const otherEmail = otherProfile.email;

    if (!(await usersAreConnected(myEmail, otherEmail))) {
      fs.unlinkSync(req.file.path); // delete uploaded file if not connected
      return res.status(403).json({ error: 'Not connected with this user' });
    }

    const myProfile  = await ProfileUser.findOne({ email: myEmail });
    const senderName = myProfile ? myProfile.fullName : myEmail;

    // Determine type from mimetype
    const isImage = req.file.mimetype.startsWith('image/');
    const type    = isImage ? 'image' : 'document';

    // Public URL for the file
    const fileUrl = `/api/chat/files/${req.file.filename}`;

    const msg = await Message.create({
      senderEmail: myEmail, senderName,
      receiverEmail: otherEmail,
      content: req.file.originalname,
      type,
      fileName: req.file.originalname,
      fileUrl,
      fileSize: req.file.size,
    });

    res.status(201).json(msg);
  } catch (err) {
    console.error('[chat] UPLOAD error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/chat/:profileId/read ───────────────────────────────────────────
router.patch('/:profileId/read', protect, async (req, res) => {
  try {
    const myEmail      = req.user.email;
    const otherProfile = await ProfileUser.findById(req.params.profileId);
    if (!otherProfile) return res.status(404).json({ error: 'User not found' });

    await Message.updateMany(
      { senderEmail: otherProfile.email, receiverEmail: myEmail, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


// // my-backend/chat-routes.js  ← REPLACE your existing file with this

// const express  = require('express');
// const router   = express.Router();
// const jwt      = require('jsonwebtoken');
// const mongoose = require('mongoose');
// const Message  = require('./models/Message');

// // ── Auth middleware — matches YOUR jwt.sign({ userId, email }) format ─────────
// function protect(req, res, next) {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) return res.status(401).json({ error: 'No token' });
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     // YOUR server.js signs with { userId, email } — so we read userId
//     req.user = { id: decoded.userId, email: decoded.email };
//     next();
//   } catch {
//     res.status(401).json({ error: 'Invalid token' });
//   }
// }

// // ── Reuse YOUR existing Connection model (fromEmail / toEmail / status) ───────
// let Connection;
// try {
//   Connection = mongoose.model('Connection');
// } catch {
//   const s = new mongoose.Schema({}, { strict: false });
//   Connection = mongoose.model('Connection', s);
// }

// // ── Reuse YOUR existing ProfileUser model to resolve email ↔ _id ─────────────
// let ProfileUser;
// try {
//   ProfileUser = mongoose.model('ProfileUser');
// } catch {
//   const s = new mongoose.Schema({}, { strict: false });
//   ProfileUser = mongoose.model('ProfileUser', s);
// }

// // Check connection using YOUR schema: fromEmail / toEmail / status
// async function usersAreConnected(emailA, emailB) {
//   const doc = await Connection.findOne({
//     $or: [
//       { fromEmail: emailA, toEmail: emailB, status: 'accepted' },
//       { fromEmail: emailB, toEmail: emailA, status: 'accepted' },
//     ],
//   });
//   return !!doc;
// }

// // ── GET /api/chat/:profileId  – load message history ─────────────────────────
// router.get('/:profileId', protect, async (req, res) => {
//   try {
//     const myEmail = req.user.email;
//     const otherId = req.params.profileId;

//     // Resolve other user's email from their ProfileUser _id
//     const otherProfile = await ProfileUser.findById(otherId);
//     if (!otherProfile) return res.status(404).json({ error: 'User not found' });
//     const otherEmail = otherProfile.email;

//     if (!(await usersAreConnected(myEmail, otherEmail))) {
//       return res.status(403).json({ error: 'Not connected with this user' });
//     }

//     const messages = await Message.find({
//       $or: [
//         { senderEmail: myEmail,    receiverEmail: otherEmail },
//         { senderEmail: otherEmail, receiverEmail: myEmail    },
//       ],
//     }).sort({ createdAt: 1 });

//     res.json(messages);
//   } catch (err) {
//     console.error('[chat] GET error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // ── POST /api/chat/:profileId  – send a message ───────────────────────────────
// router.post('/:profileId', protect, async (req, res) => {
//   try {
//     const myEmail = req.user.email;
//     const otherId = req.params.profileId;
//     const content = req.body.content?.trim();

//     if (!content) return res.status(400).json({ error: 'Empty message' });

//     const otherProfile = await ProfileUser.findById(otherId);
//     if (!otherProfile) return res.status(404).json({ error: 'User not found' });
//     const otherEmail = otherProfile.email;

//     if (!(await usersAreConnected(myEmail, otherEmail))) {
//       return res.status(403).json({ error: 'Not connected with this user' });
//     }

//     // Get sender's name for display
//     const myProfile = await ProfileUser.findOne({ email: myEmail });
//     const senderName = myProfile ? myProfile.fullName : myEmail;

//     const msg = await Message.create({
//       senderEmail:   myEmail,
//       senderName,
//       receiverEmail: otherEmail,
//       content,
//     });

//     res.status(201).json(msg);
//   } catch (err) {
//     console.error('[chat] POST error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // ── PATCH /api/chat/:profileId/read  – mark as read ──────────────────────────
// router.patch('/:profileId/read', protect, async (req, res) => {
//   try {
//     const myEmail = req.user.email;
//     const otherProfile = await ProfileUser.findById(req.params.profileId);
//     if (!otherProfile) return res.status(404).json({ error: 'User not found' });

//     await Message.updateMany(
//       { senderEmail: otherProfile.email, receiverEmail: myEmail, read: false },
//       { $set: { read: true } }
//     );
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;