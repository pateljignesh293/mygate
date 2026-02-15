const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Society = require('../models/Society');
const { protect, authorize } = require('../middleware/auth');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('role').isIn(['resident', 'security', 'staff', 'vendor']).withMessage('Invalid role'),
  body('societyId').notEmpty().withMessage('Society ID is required'),
  body('flatNo').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phone, role, societyId, flatNo, block } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if society exists
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      societyId,
      flatNo: flatNo || null,
      block: block || null,
      isApproved: role === 'resident' ? false : true // Residents need approval
    });

    // If resident, notify admins
    if (role === 'resident' && !user.isApproved) {
      // Get society admins
      const admins = await User.find({ 
        societyId, 
        role: { $in: ['society_admin', 'super_admin'] } 
      });

      // Notify admins (would use notification service in production)
      console.log(`New resident ${user.name} registered and pending approval`);
    }

    // Generate token
    const token = generateToken(user._id, user.role, user.societyId);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      },
      message: role === 'resident' && !user.isApproved 
        ? 'Registration successful. Your account is pending admin approval.'
        : 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role, user.societyId);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyId: user.societyId,
        flatNo: user.flatNo,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('societyId', 'name address')
      .select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If email exists, password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: `You requested a password reset. Click the link to reset: ${resetUrl}`,
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      });

      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.put('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role, user.societyId);

    res.json({
      success: true,
      token,
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/update-password
// @desc    Update password
// @access  Private
router.put('/update-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/auth/create-admin
// @desc    Create admin user (Development/Setup only)
// @access  Public (only in development) or Private (Super Admin)
const createAdminHandler = async (req, res) => {
  try {
    // Only allow in development or if super admin is creating
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isSuperAdmin = req.user && req.user.role === 'super_admin';

    if (!isDevelopment && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin creation is only allowed in development mode or by super admin'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phone, role, societyId } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // For society_admin, societyId is required
    if (role === 'society_admin' && !societyId) {
      return res.status(400).json({
        success: false,
        message: 'Society ID is required for society admin'
      });
    }

    // Check if society exists (for society_admin)
    if (role === 'society_admin') {
      const society = await Society.findById(societyId);
      if (!society) {
        return res.status(404).json({
          success: false,
          message: 'Society not found'
        });
      }
    }

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      phone,
      role,
      societyId: role === 'super_admin' ? undefined : societyId,
      isApproved: true,
      isActive: true
    });

    // Generate token
    const token = generateToken(admin._id, admin.role, admin.societyId);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        societyId: admin.societyId
      },
      message: 'Admin user created successfully'
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin creation',
      error: error.message
    });
  }
};

// Apply middleware conditionally
if (process.env.NODE_ENV === 'development') {
  // In development, allow without auth
  router.post('/create-admin', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
    body('role').isIn(['super_admin', 'society_admin']).withMessage('Invalid admin role'),
    body('societyId').optional().isMongoId().withMessage('Invalid society ID')
  ], createAdminHandler);
} else {
  // In production, require super admin auth
  router.post('/create-admin', protect, authorize('super_admin'), [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
    body('role').isIn(['super_admin', 'society_admin']).withMessage('Invalid admin role'),
    body('societyId').optional().isMongoId().withMessage('Invalid society ID')
  ], createAdminHandler);
}

module.exports = router;
