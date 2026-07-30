import express from 'express';
import { guestLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/guest', guestLogin);

export default router;
