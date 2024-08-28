const userModel = require("../models/user-model");
const orderModel = require("../models/order-model");
const courseModel = require("../models/course-model");
const ErrorHandler = require("../utils/ErrorHandler");
const { CatchAsyncError } = require("../middleware/catchAsyncError");
const generateLast12MonthsData = require("../middleware/analytics-generator");

const getUserAnalytics = CatchAsyncError(async (req, res, next) => {
    try {
        // Await the asynchronous function
        const users = await generateLast12MonthsData(userModel);

        // Send the response with the awaited result
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

const getOrderAnalytics = CatchAsyncError(async (req, res, next) => {
    try {
        // Await the asynchronous function
        const order = await generateLast12MonthsData(orderModel);

        // Send the response with the awaited result
        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

const getCourseAnalytics = CatchAsyncError(async (req, res, next) => {
    try {
        // Await the asynchronous function
        const course = await generateLast12MonthsData(courseModel);

        // Send the response with the awaited result
        res.status(200).json({
            success: true,
            course
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

module.exports = {getUserAnalytics,getOrderAnalytics,getCourseAnalytics};