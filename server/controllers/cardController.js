import Card from '../models/Card.js';
import Review from '../models/Review.js';
import { scheduleReview } from '../../shared/sm2.js';

// @desc    Get all cards for a user
// @route   GET /api/cards
export const getCards = async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get cards due for review
// @route   GET /api/cards/due
export const getDueCards = async (req, res) => {
  try {
    const now = new Date();
    const cards = await Card.find({
      userId: req.user.id,
      nextReview: { $lte: now }
    }).sort({ nextReview: 1 });

    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new card
// @route   POST /api/cards
export const createCard = async (req, res) => {
  try {
    const { front, back } = req.body;

    if (!front || !back) {
      return res.status(400).json({ message: 'Front and back are required' });
    }

    const card = new Card({
      userId: req.user.id,
      front: front.trim(),
      back: back.trim()
    });

    await card.save();
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a card
// @route   PUT /api/cards/:id
export const updateCard = async (req, res) => {
  try {
    const { front, back } = req.body;

    if (!front || !back) {
      return res.status(400).json({ message: 'Front and back are required' });
    }

    const card = await Card.findOne({ _id: req.params.id, userId: req.user.id });

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    card.front = front.trim();
    card.back = back.trim();
    card.updatedAt = new Date();

    await card.save();
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a card
// @route   DELETE /api/cards/:id
export const deleteCard = async (req, res) => {
  try {
    const card = await Card.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Rate a card (update spaced repetition)
// @route   POST /api/cards/:id/rate
export const rateCard = async (req, res) => {
  try {
    const quality = Number(req.body.quality);

    if (!Number.isInteger(quality) || quality < 1 || quality > 4) {
      return res.status(400).json({ message: 'Quality must be between 1 and 4' });
    }

    const card = await Card.findOne({ _id: req.params.id, userId: req.user.id });

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const schedule = scheduleReview(
      {
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions
      },
      quality
    );

    card.easeFactor = schedule.easeFactor;
    card.interval = schedule.interval;
    card.repetitions = schedule.repetitions;
    card.nextReview = schedule.nextReview;
    card.updatedAt = new Date();

    await card.save();
    await Review.create({
      userId: req.user.id,
      cardId: card._id,
      quality
    });
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


