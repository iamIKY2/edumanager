const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth Header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verify error:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('Decoded user:', user);
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;