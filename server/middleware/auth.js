import jwt from 'jsonwebtoken';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Attaches decoded user to req.user
 */
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
      const id = decoded.id || decoded._id;
      if (!id) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.user = { id: String(id) };
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export default auth;