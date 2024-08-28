const express = require("express");
const {
  registerUser,
  activateUser,
  userLogin,
  userLogout,
 
  userInfo,
  socialAuth,
  updateUserInfo,
  updateUserPassword,
  updateAvatar,
  getAllUser,
  upodateUserRole,
  deleteUser,
} = require("../controllers/user-controller");
const { isAuthenticated, roleAuthenticate } = require("../middleware/auth");

const userRouter = express.Router();

userRouter.post("/registration", registerUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", userLogin);
userRouter.get("/logout", isAuthenticated, userLogout);
// userRouter.get("/refresh", updateRefreshToken);
userRouter.get("/me", isAuthenticated, userInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put("/update-user-info", isAuthenticated,updateUserInfo);
userRouter.put("/update-user-password", isAuthenticated,updateUserPassword);
userRouter.put("/update-user-avatar", isAuthenticated,updateAvatar);
userRouter.get("/get-all-users", isAuthenticated,roleAuthenticate("admin"),getAllUser);
userRouter.put("/update-user", isAuthenticated,roleAuthenticate("admin"),upodateUserRole);
userRouter.delete("/delete-user/:id", isAuthenticated,roleAuthenticate("admin"),deleteUser);
module.exports = userRouter;
