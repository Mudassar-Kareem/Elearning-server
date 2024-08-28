const ErrorHandler = require("../utils/ErrorHandler");
const { CatchAsyncError } = require("../middleware/catchAsyncError");
const ejs = require("ejs");
const sendMail = require("../utils/sendMails");
const path = require("path");
const userModel = require("../models/user-model");
const courseModel = require("../models/course-model");
const notificationModel = require("../models/notification-model");
const {newOrder, getAllOrderServices} = require("../services/order-services");
const { redis } = require("../utils/radis");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const createOrder = CatchAsyncError(async (req, res, next) => {
  try {
    const { courseId, payment_info } = req.body;
    if (payment_info) {
      if ("id" in payment_info) {
        const paymentIntentsId = payment_info.id;
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentsId);
          if (paymentIntent.status !== "succeeded") {
            return next(new ErrorHandler("Payment is not authorized", 400));
          }
        } catch (error) {
          return next(new ErrorHandler("Failed to retrieve payment intent", 500));
        }
      }
    }
    
    const user = await userModel.findById(req.user?._id);
    const courseExitInUser = user?.courses.some((course) =>
      course._id.equals(courseId)
    );
    if (courseExitInUser) {
      return next(
        new ErrorHandler("You have already purchased this course", 400)
      );
    }
    const course = await courseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }
    const data = {
      courseId: course._id,
      userId: user?._id,
      payment_info,
    };

    const mailData = {
      order: {
        _id: course._id,
        name: course.name,
        price: course.prices,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    };
    const html = ejs.renderFile(
      path.join(__dirname, "../mails/order-mails.ejs"),
      { order: mailData }
    );
    try {
      if (user) {
        await sendMail({
          email: user.email,
          subject: "Order Confirmation",
          template: "order-mails.ejs",
          data: mailData,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 404));
    }
    course.purchased = course.purchased + 1
    course.save();

    user?.courses.push(course?._id);
    await redis.set(req.user?._id,JSON.stringify(user));
    await user?.save();
    await notificationModel.create({
      user: user?._id,
      title: "New order",
      message: `You have new order from ${user.name} for the course  ${course?.name}`,
    });
    newOrder(data, res, next);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get all user --- only for admin
const getAllOrders = CatchAsyncError(async(req,res,next)=>{
  try {
    getAllOrderServices(res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
})

const sendStripePublicKey = CatchAsyncError(async(req,res)=>{
  res.status(200).json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  })
})

const newPayment = CatchAsyncError(async (req, res, next) => {
  try {
    const { amount } = req.body; // Ensure amount is extracted from the request body
    if (!amount) {
      return next(new ErrorHandler("Missing required param: amount", 400));
    }

    const myPayment = await stripe.paymentIntents.create({
      amount,
      currency: "USD",
      metadata: {
        company: "E-Learning",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(201).json({
      success: true,
      client_secret: myPayment.client_secret,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});



module.exports = { createOrder, getAllOrders ,sendStripePublicKey,newPayment};
