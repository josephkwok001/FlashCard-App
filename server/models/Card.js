import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  front: {
    type: String,
    required: true,
    trim: true
  },
  back: {
    type: String,
    required: true,
    trim: true
  },
  easeFactor: {
    type: Number,
    default: 2.5,
    min: 1.3
  },
  interval: {
    type: Number,
    default: 0
  },
  repetitions: {
    type: Number,
    default: 0
  },
  nextReview: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
cardSchema.index({ userId: 1, nextReview: 1 });
cardSchema.index({ userId: 1, createdAt: -1 });

// Virtual for checking if card is due
cardSchema.virtual('isDue').get(function() {
  return this.nextReview <= new Date();
});

const Card = mongoose.model('Card', cardSchema);

export default Card;