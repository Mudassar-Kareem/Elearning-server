const mongoose = require("mongoose");

// Review Schema
const reviewSchema = new mongoose.Schema({
  user: {
    type: Object,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  comment: {
    type: String,
  },
  commentReplies:[Object],
},{timestamps:true});

// Link Schema
const linkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

// Comment Schema
const commentSchema = new mongoose.Schema({
  user: {
    type: Object,
    required: true,
  },
  question: {
    type: String,
  },
  questionReplies: [Object],
},{timestamps:true});

// Course Data Schema
const courseDataSchema = new mongoose.Schema({
  videoUrl: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  videoSection: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  videoLength: {
    type: Number,
    // required: true,
  },
  videoPlayer: {
    type: String,
    // required: true,
  },
  links: [linkSchema],
  suggestions: {
    type: String,
    // required: true,
  },
  questions: [commentSchema],
});

// Course Schema
const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: true,
  },
  description: {
    type: String,
    // required: true,
  },
  categories: {
    type: String,
    // required: true,
  },
  prices: {
    type: Number,
    // required: true,
  },
  estimatedPrices: {
    type: Number,
  },
  thumbnail: {
    public_id: String,
    url: String,
  },
  tags: {
    type: String,
    // required: true,
  },
  level: {
    type: String,
    // required: true,
  },
  demoUrl: {
    type: String,
    // required: true,
  },
  benefits: [{ title: String }],
  prerequisites: [{ title: String }],
  reviews: [reviewSchema],
  courseData: [courseDataSchema],
  ratings: {
    type: Number,
    default: 0,
  },
  purchased: {
    type: Number,
    default: 0,
  },
},{timestamps: true});

const courseModel = mongoose.model("Course", courseSchema);
module.exports = courseModel;
