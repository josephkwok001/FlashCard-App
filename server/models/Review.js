import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true
  },
  quality: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reviewSchema.index({ userId: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
