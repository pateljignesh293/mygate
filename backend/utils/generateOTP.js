// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate OTP expiry time (default 10 minutes)
const generateOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = { generateOTP, generateOTPExpiry };
