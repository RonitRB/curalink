import mongoose from 'mongoose';

const publicationSchema = new mongoose.Schema({
  id: String,
  title: String,
  abstract: String,
  authors: [String],
  year: Number,
  source: String,
  url: String,
  finalScore: Number,
}, { _id: false });

const trialSchema = new mongoose.Schema({
  id: String,
  title: String,
  status: String,
  briefSummary: String,
  eligibilityCriteria: String,
  minAge: String,
  maxAge: String,
  location: String,
  contactInfo: String,
  url: String,
  finalScore: Number,
}, { _id: false });

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  metadata: {
    publications: [publicationSchema],
    clinicalTrials: [trialSchema],
    expandedQuery: String,
    llmResponse: mongoose.Schema.Types.Mixed,
    stats: mongoose.Schema.Types.Mixed,
  },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  patientName: { type: String, default: '' },
  disease: { type: String, default: '' },
  location: { type: String, default: '' },
  messages: [messageSchema],
}, {
  timestamps: true,
});

export default mongoose.model('Session', sessionSchema);
