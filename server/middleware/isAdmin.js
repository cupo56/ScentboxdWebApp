const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Kein Token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin')
      return res.status(403).json({ message: 'Kein Zugriff' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Ungültiger Token' });
  }
};
