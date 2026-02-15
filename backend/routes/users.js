const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { notifyUser } = require('../utils/notifyUser');

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate('relatedId')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50)
      .skip(parseInt(req.query.skip) || 0);

    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/approve/:id
// @desc    Approve resident
// @access  Private (Admins)
router.put('/approve/:id', protect, authorize('society_admin', 'super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'resident') {
      return res.status(400).json({
        success: false,
        message: 'Only residents can be approved'
      });
    }

    // Check access
    if (req.user.role === 'society_admin' && user.societyId?.toString() !== req.user.societyId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    user.isApproved = true;
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();
    await user.save();

    // Notify user
    const io = req.app.get('io');
    if (io) {
      await notifyUser(io, user._id, {
        societyId: user.societyId,
        type: 'general',
        title: 'Account Approved',
        message: 'Your account has been approved by the admin',
        priority: 'high'
      });
    }

    res.json({
      success: true,
      user,
      message: 'User approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/pending-approvals
// @desc    Get pending approvals
// @access  Private (Admins)
router.get('/pending-approvals', protect, authorize('society_admin', 'super_admin'), async (req, res) => {
  try {
    let query = {
      role: 'resident',
      isApproved: false
    };

    if (req.user.role === 'society_admin') {
      query.societyId = req.user.societyId;
    }

    const users = await User.find(query)
      .select('name email phone flatNo block createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().matches(/^[0-9]{10}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const allowedUpdates = ['name', 'phone', 'profilePic'];
    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        req.user[update] = req.body[update];
      }
    });

    await req.user.save();

    res.json({
      success: true,
      user: req.user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
