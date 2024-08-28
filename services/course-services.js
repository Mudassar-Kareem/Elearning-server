const { CatchAsyncError } = require("../middleware/catchAsyncError");
const courseModel = require("../models/course-model");

const createCourse = CatchAsyncError(async (data, res) => {
    const course = await courseModel.create(data);
    res.status(200).json({
        success: true,
        course
    });
});

// get all courses
const getAllCourseServices = async(res) =>{
    const courses = await courseModel.find().sort({createdAt : -1});
    res.status(200).json({
      success: true,
      courses
    })
  }
module.exports = {createCourse,getAllCourseServices};
