const express = require("express");
const { isAuthenticated, roleAuthenticate } = require("../middleware/auth");
const { getUserAnalytics, getOrderAnalytics, getCourseAnalytics } = require("../controllers/analytics-controller");
const analyticRoutes = express.Router();

analyticRoutes.get("/get-user-analytics", isAuthenticated,roleAuthenticate("admin"),getUserAnalytics);
analyticRoutes.get("/get-order-analytics", isAuthenticated,roleAuthenticate("admin"),getOrderAnalytics);
analyticRoutes.get("/get-course-analytics", isAuthenticated,roleAuthenticate("admin"),getCourseAnalytics);


module.exports = analyticRoutes;