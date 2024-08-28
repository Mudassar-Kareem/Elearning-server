
const { redis } = require("../utils/radis");
const userModel = require("../models/user-model");
//get user by ID
const getUserById = async (id, res) => {
  console.log("Looking for user with ID:", id); // Debug ID

  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson);
    console.log("User found:", user); // Debug user data
    res.status(200).json({
      success: true,
      user,
    });
  }
};

// get all user 
const getAllUserServices = async(res) =>{
  const users = await userModel.find().sort({createdAt : -1});
  res.status(200).json({
    success: true,
    users
  })
}

// update user role services
const updateUserRoleServices = async (res, id, role) => {
  console.log("Updating user with ID:", id, "to role:", role); // Log before update
  
  const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });
  
  console.log("Updated user:", user); // Log the updated user document
  
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    user,
  });
};

module.exports = { getUserById,getAllUserServices,updateUserRoleServices};
