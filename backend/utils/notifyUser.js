const Notification = require('../models/Notification');

// Send notification to user (creates DB record and emits socket event)
const notifyUser = async (io, userId, notificationData) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      ...notificationData
    });

    // Emit socket event to user's room
    if (io) {
      io.to(`user-${userId}`).emit('notification', {
        id: notification._id,
        ...notificationData,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send notification to multiple users
const notifyUsers = async (io, userIds, notificationData) => {
  try {
    const notifications = [];
    
    for (const userId of userIds) {
      const notification = await notifyUser(io, userId, notificationData);
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Error sending notifications to multiple users:', error);
    throw error;
  }
};

module.exports = { notifyUser, notifyUsers };
