const ErrorHandler = require("../utils/ErrorHandler");
const { CatchAsyncError } = require("../middleware/catchAsyncError");
const notificationModel = require("../models/notification-model");
const cron = require("node-cron");

// get all notification
const getNotification = CatchAsyncError(async (req, res, next) => {
  try {
    const notification = await notificationModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update notification status
const updateNotificationStatus = CatchAsyncError(async (req, res, next) => {
  try {
    const notification = await notificationModel.findById(req.params.id);
    if (!notification) {
      return next(new ErrorHandler("Notification not found", 400));
    } else {
      notification.status
        ? (notification.status = "read")
        : notification.status;
    }
    await notification.save();
    const notifications = await notificationModel
      .find()
      .sort({ createdAt: -1 });
    res.status(201).json({
      success: true,
      notifications,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// delete notification using corn
// Schedule the cron job to run every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
      // Calculate the date 30 days ago
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      // Delete read notifications older than 30 days
      const result = await notificationModel.deleteMany({
          status: 'read',
          createdAt: { $lt: thirtyDaysAgo }
      });
      console.log(`Deleted ${result.deletedCount} read notifications older than 30 days`);
  } catch (error) {
      console.error('Error deleting notifications:', error.message);
  }
});

module.exports = { getNotification, updateNotificationStatus };
