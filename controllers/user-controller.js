const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");
const ErrorHandler = require("../utils/ErrorHandler");
const { CatchAsyncError } = require("../middleware/catchAsyncError");
const sendMail = require("../utils/sendMails");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const {
  SendToken,
  accessTokenOptions,
  refreshTokenOptions,
} = require("../utils/sendToken");
const { redis } = require("../utils/radis");
const {
  getUserById,
  getAllUserServices,
  updateUserRoleServices,
} = require("../services/user-services");

// Register user and send activation email
const registerUser = CatchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  const isExistEmail = await userModel.findOne({ email });
  if (isExistEmail) {
    return next(new ErrorHandler("Email already exists", 400));
  }

  const activationToken = createActivationCode({ name, email, password });
  const activationCode = activationToken.activationCode;
  const data = { user: { name }, activationCode };

  try {
    await sendMail({
      email,
      subject: "Activate your account",
      template: "activation-mails.ejs",
      data,
    });

    res.status(201).json({
      success: true,
      message: "Please check your email to activate your account",
      activationToken: activationToken.token,
    });
  } catch (error) {
    console.error("Error sending activation email:", error);
    return next(new ErrorHandler("Error sending activation email", 500));
  }
});

const createActivationCode = (user) => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

// Activate user based on token and code
const activateUser = CatchAsyncError(async (req, res, next) => {
  const { activationToken, activationCode } = req.body;

  try {
    const decoded = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
    const { activationCode: storedActivationCode, user } = decoded;

    if (activationCode !== storedActivationCode) {
      return next(new ErrorHandler("Activation code is invalid.", 400));
    }

    const { name, email, password } = user;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler("User already exists.", 400));
    }

    // const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await userModel.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: "User activated successfully.",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const userLogin = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.error("Email or password missing");
      return next(new ErrorHandler("Please enter email and password", 400));
    }

    // Find user by email and include password field
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      console.error("User not found");
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    // Compare the provided password with the stored hashed password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      console.error("Password mismatch");
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    // Send token if everything is correct
    SendToken(user, 200, res);
  } catch (error) {
    console.error("Error during login:", error);
    return next(new ErrorHandler(error.message, 400));
  }
});

// user logout
const userLogout = CatchAsyncError(async (req, res, next) => {
  try {
    res.cookie("access_token", "", { maxAge: 1 });
    res.cookie("refresh_token", "", { maxAge: 1 });
    redis.del(req.user._id);
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// refresh token

const updateRefreshToken = CatchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.REFREASH_TOKEN); // Ensure  is correct
    } catch (error) {
      return next(new ErrorHandler("Refresh token is not valid", 401));
    }
    if (!decoded) {
      return next(new ErrorHandler("Refresh  token is not valid", 401));
    }
    const session = await redis.get(decoded.id);
    if (!session) {
      return next(new ErrorHandler("Please login to access this resources!", 401));
    }
    const user = JSON.parse(session);
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFREASH_TOKEN, {
      expiresIn: "3d",
    });
    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
      expiresIn: "5m",
    });
    req.user = user;
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    await redis.set(user._id,JSON.stringify(user), "EX", 604800)
    // res.status(200).json({
    //   success: true,
    //   accessToken,
    // });
    next();
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
// get user Info
const userInfo = CatchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id;
    getUserById(userId, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// social auth

const socialAuth = CatchAsyncError(async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      const newUser = await userModel.create({ name, email, avatar });
      SendToken(newUser, 200, res);
    } else {
      SendToken(user, 200, res);
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user Info
const updateUserInfo = CatchAsyncError(async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user?._id;
    const user = await userModel.findById(userId);
    if (name && user) {
      user.name = name;
    }
    await user.save();
    await redis.set(userId, JSON.stringify(user));
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user password
const updateUserPassword = CatchAsyncError(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await userModel.findById(req.user._id).select("+password");
    if (!oldPassword || !newPassword) {
      return next(new ErrorHandler("Please enter new and old password", 400));
    }
    if (user?.password === undefined) {
      return next(new ErrorHandler("Invalid User", 400));
    }
    const isPasswordMatch = await user?.comparePassword(oldPassword);
    if (!isPasswordMatch) {
      return next(new ErrorHandler("Old passsword is wrong", 400));
    }
    user.password = newPassword;
    await user.save();
    await redis.set(req.user?._id, JSON.parse(user));
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user profile pic
const updateAvatar = CatchAsyncError(async (req, res, next) => {
  try {
    const { avatar } = req.body; // Assuming 'avatar' is base64 string or URL
    const userId = req.user?._id;
    const user = await userModel.findById(userId);

    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    // Check if 'avatar' is provided
    if (!avatar) {
      return next(new ErrorHandler('No avatar provided', 400));
    }

    // Delete old image if it exists
    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    // Upload new image to Cloudinary
    const result = await cloudinary.uploader.upload(avatar, {
      folder: 'avatars',
      width: 150,
    });

    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };

    await user.save();

    // Update Redis cache
    await redis.set(userId, JSON.stringify(user)); // Ensure you're using the correct Redis method

    res.status(201).json({
      status: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get all user ---- only for admin
const getAllUser = CatchAsyncError(async (req, res, next) => {
  try {
    getAllUserServices(res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// updata user role
const upodateUserRole = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const userExist = await userModel.findOne({email});
    if(userExist){
      const id=userExist._id
      updateUserRoleServices(res, id, role);
    }else{
      res.status(400).json({
        success: false,
        mesage: "User not found"
      })
    }
    
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
// delete user --- only for admin
const deleteUser = CatchAsyncError(async(req,res,next)=>{
  try {
    const {id} =req.params;
    const user = await userModel.findById(id);
    if(!user){
      return next(new ErrorHandler("user not found", 400));
    }
    await user.deleteOne({ _id: id });
    await redis.del(id);
    res.status(200).json({
      success: true,
      message : "User deleted successfully "
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
})

module.exports = {
  registerUser,
  activateUser,
  userLogin,
  userLogout,
  updateRefreshToken,
  userInfo,
  socialAuth,
  updateUserInfo,
  updateUserPassword,
  updateAvatar,
  getAllUser,
  upodateUserRole,
  deleteUser
};
