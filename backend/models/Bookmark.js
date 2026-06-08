import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
  },
  messageIndex: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    default: 'Untitled Research',
  },
  disease: {
    type: String,
    default: '',
  },
  preview: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Compound index for fast per-user lookups
bookmarkSchema.index({ userId: 1, createdAt: -1 });

// Prevent duplicate bookmarks for same message
bookmarkSchema.index({ userId: 1, sessionId: 1, messageIndex: 1 }, { unique: true });

export default mongoose.model('Bookmark', bookmarkSchema);
