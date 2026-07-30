import express from 'express';
import {
  getCards,
  getDueCards,
  createCard,
  updateCard,
  deleteCard,
  rateCard
} from '../controllers/cardController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Routes that require authentication
router.use(auth);

// @route   GET /api/cards/due
// Get cards due for review
router.get('/due', getDueCards);

// @route   POST /api/cards
// Create new card
router.post('/', createCard);

// @route   POST /api/cards/:id/rate
// Rate a card (spaced repetition)
router.post('/:id/rate', rateCard);

// @route   PUT /api/cards/:id
// Update a card
router.put('/:id', updateCard);

// @route   DELETE /api/cards/:id
// Delete a card
router.delete('/:id', deleteCard);

// @route   GET /api/cards
// Get all cards (must be last to avoid conflicting with other routes)
router.get('/', getCards);

export default router;