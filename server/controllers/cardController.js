import Card from '../models/Card.js';

/**
 * Calculate new spaced repetition values based on quality rating
 * Algorithm adapted from SuperMemo SM-2
 *
 * @param {number} quality - Rating 1-4 (Again, Hard, Good, Easy)
 * @param {number} currentEaseFactor - Current ease factor
 * @param {number} currentInterval - Current interval in days
 * @param {number} currentRepetitions - Current repetition count
 * @returns {Object} - { easeFactor, interval, repetitions, nextReview }
 */
const calculateReviewSchedule = (quality, currentEaseFactor, currentInterval, currentRepetitions) => {
  let easeFactor = currentEaseFactor;
  let interval = currentInterval;
  let repetitions = currentRepetitions;

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Update interval and repetitions based on quality
  if (quality < 2) {
    // Failed - reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    repetitions = repetitions + 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Calculate next review date
  const nextReview = new Date();
  if (quality >= 2) {
    nextReview.setDate(nextReview.getDate() + interval);
  }

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview
  };
};

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
    const { quality } = req.body;

    if (quality < 1 || quality > 4) {
      return res.status(400).json({ message: 'Quality must be between 1 and 4' });
    }

    const card = await Card.findOne({ _id: req.params.id, userId: req.user.id });

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const schedule = calculateReviewSchedule(
      quality,
      card.easeFactor,
      card.interval,
      card.repetitions
    );

    card.easeFactor = schedule.easeFactor;
    card.interval = schedule.interval;
    card.repetitions = schedule.repetitions;
    card.nextReview = schedule.nextReview;
    card.updatedAt = new Date();

    await card.save();
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


