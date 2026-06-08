


// my-backend/models/Message.js — REPLACE existing file

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderEmail:   { type: String, required: true },
    senderName:    { type: String, default: '' },
    receiverEmail: { type: String, required: true },
    // For text messages
    content:       { type: String, default: '', maxlength: 2000 },
    // For file messages: 'text' | 'image' | 'document'
    type:          { type: String, enum: ['text','image','document'], default: 'text' },
    // Stored file info
    fileName:      { type: String, default: '' },
    fileUrl:       { type: String, default: '' },
    fileSize:      { type: Number, default: 0 },
    read:          { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ senderEmail: 1, receiverEmail: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);