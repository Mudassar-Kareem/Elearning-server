const express = require("express");
const {
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
} = require("../controllers/course-controller");
const { isAuthenticated, roleAuthenticate } = require("../middleware/auth");

const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  
  isAuthenticated,
  roleAuthenticate("admin"),
  uploadCourse
);
courseRouter.put(
  "/edit-course/:id",
  
  isAuthenticated,
  roleAuthenticate("admin"),
  editCourse
);
courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-courses", getAllCourse);
courseRouter.get("/get-course-content/:id",  isAuthenticated, getCourseByUser);
courseRouter.put("/add-question",  isAuthenticated, addQuestion);
courseRouter.put("/add-answer",  isAuthenticated, addAnswer);
courseRouter.put("/add-review/:id",  isAuthenticated, addReview);
courseRouter.put("/add-reply", isAuthenticated,roleAuthenticate("admin") ,addRepleyToReview);
courseRouter.get("/get-all-courses", isAuthenticated,roleAuthenticate("admin") ,getAllCourses);
courseRouter.delete("/delete-course/:id", isAuthenticated,roleAuthenticate("admin") ,deleteCourse);
courseRouter.post("/getVideoCipherOTP",generateVideoUrl)
module.exports = courseRouter;
