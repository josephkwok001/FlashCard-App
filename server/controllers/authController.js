import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc    Create or reuse a guest session and return JWT
// @route   POST /api/auth/guest
export const guestLogin = async (_req, res) => {
  try {
    let user = await User.findOne({ isGuest: true });

    if (!user) {
      user = await User.create({ isGuest: true, name: 'Guest' });
    }

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user._id.toString(), name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
