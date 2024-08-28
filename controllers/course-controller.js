const courseModel = require("../models/course-model");
const cloudinary = require("cloudinary").v2;
const ErrorHandler = require("../utils/ErrorHandler");
const { CatchAsyncError } = require("../middleware/catchAsyncError");
const {
  createCourse,
  getAllCourseServices,
} = require("../services/course-services");
const { redis } = require("../utils/radis");
const { default: mongoose } = require("mongoose");
const ejs = require("ejs");
const sendMail = require("../utils/sendMails");
const path = require("path");
const notificationModel = require("../models/notification-model");
const axios = require("axios");

const uploadCourse = CatchAsyncError(async (req, res, next) => {
  try {
    const data = req.body;
    console.log("Received data:", data);
    const thumbnail = data.thumbnail;

    if (thumbnail) {
      const myCloud = await cloudinary.uploader.upload(thumbnail, {
        folder: "courses",
      });
      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    console.log("Processed data:", data);
    createCourse(data, res);
  } catch (error) {
    console.error("Error:", error);
    return next(new ErrorHandler(error.message, 400));
  }
});

// edit course
const editCourse = CatchAsyncError(async (req, res, next) => {
  try {
    const data = req.body;
    let thumbnail = data.thumbnail;

    const courseId = req.params.id;

    const courseData = await courseModel.findById(courseId);

    if (thumbnail && !thumbnail.startsWith("https")) {
      await cloudinary.uploader.destroy(courseData.thumbnail.public_id);

      const myCloud = await cloudinary.uploader.upload(thumbnail, {
        folder: "courses",
      });

      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    if (thumbnail.startsWith("https")) {
      data.thumbnail = {
        public_id: courseData.thumbnail.public_id,
        url: courseData.thumbnail.url,
      };
    }
    const course = await courseModel.findByIdAndUpdate(
      courseId,
      {
        $set: data,
      },
      { new: true }
    );
    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Error:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// get single course without purchasing
const getSingleCourse = CatchAsyncError(async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const isCatchExit = await redis.get(courseId);
    if (isCatchExit) {
      // get data from redis
      const course = JSON.parse(isCatchExit);
      res.status(200).json({
        success: true,
        course,
      });
    } else {
      const course = await courseModel
        .findById(courseId)
        .select(
          "-courseData.videoUrl -courseData.questions -courseData.suggestions -courseData.links"
        );
      // save data in redis
      await redis.set(courseId, JSON.stringify(course), "EX", 604800);
      res.status(200).json({
        success: true,
        course,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// get all course without purchasing
const getAllCourse = CatchAsyncError(async (req, res, next) => {
  try {
    const courses = await courseModel
      .find()
      .select(
        "-courseData.videoUrl -courseData.questions -courseData.suggestions -courseData.links"
      );

    // Optional: Uncomment if you want to use Redis for caching
    // await redis.set("allCourses", JSON.stringify(courses));

    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    // Pass the error to the next middleware (error handler)
    return next(new ErrorHandler(error.message, 500));
  }
});

// get course content only for valid user
const getCourseByUser = CatchAsyncError(async (req, res, next) => {
  try {
    const userCourseList = req.user?.courses;
    const courseId = req.params.id;
    const courseExit = userCourseList?.find(
      (course) => course._id.toString() === courseId
    );
    if (!courseExit) {
      return next(
        new ErrorHandler("You are not eligibal for this course", 400)
      );
    }
    const course = await courseModel.findById(courseId);
    const content = course?.courseData;
    console.log(content);
    res.status(200).json({
      success: true,
      content,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// add question in course

const addQuestion = CatchAsyncError(async (req, res, next) => {
  try {
    const { courseId, contentId, question } = req.body;
    const course = await courseModel.findById(courseId);
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler("Invalid content Id", 500));
    }
    const courseContent = course?.courseData?.find((cours) =>
      cours._id.equals(contentId)
    );
    if (!courseContent) {
      return next(new ErrorHandler("Invalid content Id", 500));
    }
    const newQuestion = {
      question,
      user: req.user,
      questionReplies: [],
    };
    courseContent.questions.push(newQuestion);
    await notificationModel.create({
      user: req.user?._id,
      title: "New Question",
      message: `You have new Question recived from ${req.user?.name} in  ${courseContent?.title}}`,
    });
    await course?.save();
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// get replies of the questions
const addAnswer = CatchAsyncError(async (req, res, next) => {
  try {
    const { answer, questionId, courseId, contentId } = req.body;
    const course = await courseModel.findById(courseId);
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler("Invalid connent Id", 500));
    }
    const courseContent = course?.courseData?.find((item) =>
      item._id.equals(contentId)
    );
    if (!courseContent) {
      return next(new ErrorHandler("Invalid connent Id", 500));
    }
    const question = courseContent?.questions?.find((item) =>
      item._id.equals(questionId)
    );
    // create a new answer
    const newAnswer = {
      user: req.user,
      answer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    question?.questionReplies.push(newAnswer);
    await course?.save();

    if (req.user._id === question.user._id) {
      // create notification
      await notificationModel.create({
        user: req.user?._id,
        title: "New Question Reply Recived ",
        message: `You have new Question Replay recived from ${req.user?.name} in  ${courseContent?.title}`,
      });
    } else {
      const data = {
        name: question.user.name,
        title: courseContent.title,
      };
      const html = ejs.renderFile(
        path.join(__dirname, "../mails/question-mails.ejs"),
        data
      );
      try {
        await sendMail({
          email: question.user.email,
          subject: "Question Reply",
          template: "question-mails.ejs",
          data,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// add review in course
const addReview = CatchAsyncError(async (req, res, next) => {
  try {
    const userCourseList = req.user?.courses;
    const courseId = req.params.id;
    const courseExist = userCourseList?.find(
      (course) => course._id.toString() === courseId.toString()
    );
    if (!courseExist) {
      return next(
        new ErrorHandler("You are not access able for this course", 500)
      );
    }
    const course = await courseModel.findById(courseId);
    const { review, rating } = req.body;
    const reviewData = {
      user: req.user,
      rating,
      comment: review,
    };
    course?.reviews.push(reviewData);
    let avg = 0;
    course?.reviews.forEach((rev) => {
      avg += rev.rating;
    });
    if (course) {
      course.ratings = avg / course.reviews.length;
    }
    await course?.save();
    await redis.set(courseId,JSON.stringify(course),"EX",604800)
    await notificationModel.create({
      user: req.user?._id,
      title: "New Review Recived",
      message: `${req.user?.name} has given a review in ${course?.name}`,
    });

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// add replies in review

const addRepleyToReview = CatchAsyncError(async (req, res, next) => {
  try {
    const { comment, courseId, reviewId } = req.body;
    const course = await courseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Course not found", 500));
    }
    const review = course?.reviews?.find((item) => item._id.equals(reviewId));
    if (!review) {
      return next(new ErrorHandler("Review not found", 500));
    }
    const replyData = {
      user: req.user,
      comment,
    };
    if (!review.commentReplies) {
      review.commentReplies = [];
    }
    review.commentReplies?.push(replyData);
    await course.save();
    await redis.set(courseId,JSON.stringify(course),"EX",604800)
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// get all course --- only for admin
const getAllCourses = CatchAsyncError(async (req, res, next) => {
  try {
    getAllCourseServices(res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// delete Course --- only for admin
const deleteCourse = CatchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await courseModel.findById(id);
    if (!course) {
      return next(new ErrorHandler("course not found", 400));
    }
    await course.deleteOne({ _id: id });
    await redis.del(id.toString());
    res.status(200).json({
      success: true,
      message: "Course deleted successfully ",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const generateVideoUrl = async (req, res, next) => {
  try {
    const { videoId } = req.body;
    const response = await axios.post(
      `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
      { ttl: 300 },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    // Log the error for further analysis
    console.error("Error generating video OTP:", error.message);
    return next(new ErrorHandler("Failed to generate video OTP", 500)); // Use standard HTTP status code
  }
};

module.exports = {
  uploadCourse,
  editCourse,
  getSingleCourse,
  getAllCourse,
  getCourseByUser,
  addQuestion,
  addAnswer,
  addReview,
  addRepleyToReview,
  getAllCourses,
  deleteCourse,
  generateVideoUrl,
};
