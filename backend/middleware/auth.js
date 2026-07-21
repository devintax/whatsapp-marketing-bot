const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  console.log('🔐 Auth middleware - Token received:', token ? `${token.substring(0, 20)}...` : 'None');

  // Check if no token
  if (!token) {
    console.log('🔐 Auth middleware - No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    console.log('🔐 Auth middleware - User decoded:', req.user);
    next();
  } catch (error) {
    console.log('🔐 Auth middleware - Token invalid:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};