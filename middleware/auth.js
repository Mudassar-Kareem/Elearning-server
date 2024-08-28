const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/ErrorHandler");
const { CatchAsyncError } = require("./catchAsyncError");
const { redis } = require("../utils/radis");
const { updateRefreshToken } = require("../controllers/user-controller");

const isAuthenticated = CatchAsyncError(async (req, res, next) => {
  // Extract accessToken from cookies
  const access_token = req.cookies.access_token; // Ensure `cookie-parser` middleware is used

  if (!access_token) {
    return next(new ErrorHandler("Please login to access this resource", 401)); // Use 401 for unauthorized
  }

  let decoded;
  try {
    decoded = jwt.decode(access_token); // Ensure ACCESS_TOKEN_SECRET is correct
  } catch (error) {
    return next(new ErrorHandler("Access token is not valid", 401));
  }

  if (!decoded) {
    return next(new ErrorHandler("Access token is not valid", 401));
  }
  if (decoded.exp && decoded.exp <= Date.now() / 1000) {
    try {
      await updateRefreshToken(req, res, next);
    } catch (error) {
      return next(error);
    }
  } else {
    // Fetch user data from Redis
    const user = await redis.get(decoded.id);
    if (!user) {
      return next(
        new ErrorHandler("Please login to access this resource", 404)
      ); // Use 404 for not found
    }

    req.user = JSON.parse(user);
    next();
  }
});

const roleAuthenticate = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { roleAuthenticate, isAuthenticated };
