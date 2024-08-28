const ErrorHandler = require("../utils/ErrorHandler");
const { CatchAsyncError } = require("../middleware/catchAsyncError");
const layoutModel = require("../models/layout-model");
const cloudinary = require("cloudinary").v2;

const createLayout = CatchAsyncError(async (req, res, next) => {
  try {
    const { type } = req.body;

    // Check if type is provided and is valid
    if (!type || !["Banner", "FAQ", "Categories"].includes(type)) {
      return next(new ErrorHandler("Invalid type", 400));
    }

    // Handle different types
    if (type === "Banner") {
      const { image, title, subTitle } = req.body;
      const myCloud = await cloudinary.uploader.upload(image, {
        folder: "layouts",
      });
      const banner = {
        type: "Banner", // Add type to match the schema
        banner: {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        },
      };
      await layoutModel.create(banner);
    } else if (type === "FAQ") {
      const { faq } = req.body;
      if (!Array.isArray(faq)) {
        return next(new ErrorHandler("FAQ must be an array", 400));
      }
      const faqs = {
        type: "FAQ", // Add type to match the schema
        faq,
      };
      await layoutModel.create(faqs);
    } else if (type === "Categories") {
      const { categories } = req.body;
      if (!Array.isArray(categories)) {
        return next(new ErrorHandler("Categories must be an array", 400));
      }
      const categoryData = {
        type: "Categories", // Add type to match the schema
        categories,
      };
      await layoutModel.create(categoryData);
    }

    res.status(201).json({
      success: true,
      message: "Layout Created successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const editLayout = CatchAsyncError(async (req, res, next) => {
  try {
    const { type } = req.body;

    // Check if type is provided and is valid
    if (!type || !["Banner", "FAQ", "Categories"].includes(type)) {
      return next(new ErrorHandler("Invalid type", 400));
    }

    // Handle different types
    if (type === "Banner") {
      const bannerData = await layoutModel.findOne({ type: "Banner" });
      const { image, title, subTitle } = req.body;

      let data;
      if (image.startsWith("https")) {
        if (!bannerData) {
          throw new Error("Banner data not found");
        }
        data = bannerData; // Use existing bannerData if image is a URL
      } else {
        // Upload new image if it's not a URL
        data = await cloudinary.uploader.upload(image, {
          folder: "layouts", // Ensure this folder name matches your Cloudinary setup
        });
      }

      const banner = {
        type: "Banner",
        image: {
          public_id: image.startsWith("https")
            ? bannerData?.banner?.image?.public_id
            : data.public_id,
          url: image.startsWith("https")
            ? bannerData?.banner?.image?.url
            : data.secure_url,
        },
        title,
        subTitle,
      };

      console.log(banner);

      if (bannerData) {
        await layoutModel.findByIdAndUpdate(bannerData._id, { banner });
      }
    } else if (type === "FAQ") {
      const { faq } = req.body;
      const faqId = await layoutModel.findOne({ type: "FAQ" });

      if (!Array.isArray(faq)) {
        return next(new ErrorHandler("FAQ must be an array", 400));
      }

      const faqs = {
        type: "FAQ", // Ensure type is consistent with your schema
        faq,
      };
      if (faqId) {
        await layoutModel.findByIdAndUpdate(faqId._id, { $set: faqs });
      } else {
        await layoutModel.create(faqs);
      }
    } else if (type === "Categories") {
      const { categories } = req.body;
      const catId = await layoutModel.findOne({ type: "Categories" });

      if (!Array.isArray(categories)) {
        return next(new ErrorHandler("Categories must be an array", 400));
      }

      const categoryData = {
        type: "Categories", // Ensure type is consistent with your schema
        categories,
      };
      if (catId) {
        await layoutModel.findByIdAndUpdate(catId._id, { $set: categoryData });
      } else {
        await layoutModel.create(categoryData);
      }
    }

    res.status(200).json({
      success: true,
      message: "Layout updated successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const getLayout = CatchAsyncError(async (req, res, next) => {
  try {
    const { type } = req.params;
    const layout = await layoutModel.findOne({ type });
    res.status(200).json({
      success: true,
      layout,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

module.exports = { createLayout, editLayout, getLayout };
