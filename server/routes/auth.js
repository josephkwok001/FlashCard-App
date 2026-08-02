import express from 'express';
import { guestLogin, register, login } from '../controllers/authController.js';

const router = express.Router();

router.post('/guest', guestLogin);
router.post('/register', register);
router.post('/login', login);

export default router;
