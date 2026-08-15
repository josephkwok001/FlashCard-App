import express from 'express';
import { getReviewStats } from '../controllers/reviewController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/stats', getReviewStats);

export default router;
