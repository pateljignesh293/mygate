const jwt = require('jsonwebtoken');

const generateToken = (id, role, societyId) => {
  return jwt.sign(
    { id, role, societyId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = generateToken;
