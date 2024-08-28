const { CatchAsyncError } = require("../middleware/catchAsyncError");
const orderModel = require("../models/order-model");
// create new order
const newOrder = CatchAsyncError(async (data, res) => {
  const order = await orderModel.create(data);
  res.status(201).json({
    success: true, 
    order
})
});
// get all  order
const getAllOrderServices = async(res) =>{
  const orders = await orderModel.find().sort({createdAt : -1});
  res.status(200).json({
    success: true,
    orders
  })
}
module.exports = {newOrder,getAllOrderServices};
