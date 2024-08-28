const { redis } = require("./radis");
require("dotenv").config();

// Parse environment values with integer fallback values
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// Options for cookies
const refreshTokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "Strict",
};

const accessTokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "Strict",
};


const SendToken = async (user, statusCode, res) => {
  try {
    const accessToken = await user.SignAccessToken(); // Await the token generation
    const refreshToken = await user.RefreshToken(); // Await the token generation

    // Upload session to Redis
    await redis.set(user._id.toString(), JSON.stringify(user));

    
    if (process.env.NODE_ENV === "production") {
      accessTokenOptions.secure = true;
    }
    
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(statusCode).json({
      success: true,
      user,
      accessToken, // Should be a string token
    });
  } catch (error) {
    console.error("Error in SendToken:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {SendToken,accessTokenOptions,refreshTokenOptions};
