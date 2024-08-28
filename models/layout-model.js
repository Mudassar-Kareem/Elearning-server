const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
  },
  answer: {
    type: String,
  },
});
const categorySchema = new mongoose.Schema({
  title: {
    type: String,
  },
});
const bannerSchema = new mongoose.Schema({
  public_id: {
    type: String,
  },
  url: {
    type: String,
  },
});
const layoutSchema = new mongoose.Schema(
  {
    type: {
      type: String,
    },
    faq: [faqSchema],
    categories: [categorySchema],
    banner: {
      image: bannerSchema,
      title: {
        type: String,
      },
      subTitle: {
        type: String,
      },
    },
  },
  { timestamps: true }
);
const layoutModel = mongoose.model("layout", layoutSchema);
module.exports = layoutModel;
