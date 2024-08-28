const express = require("express");
const { isAuthenticated, roleAuthenticate } = require("../middleware/auth");
const { getNotification, updateNotificationStatus } = require("../controllers/notification-controllers");

const notificationRouter = express.Router();

notificationRouter.get("/get-all-notification",isAuthenticated,roleAuthenticate("admin"),getNotification);
notificationRouter.put("/update-notification/:id",isAuthenticated,roleAuthenticate("admin"),updateNotificationStatus);

module.exports = {notificationRouter};