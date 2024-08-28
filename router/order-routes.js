const express = require("express");
const { isAuthenticated, roleAuthenticate } = require("../middleware/auth");
const { createOrder, getAllOrders,sendStripePublicKey, newPayment } = require("../controllers/order-controller");
const orderRouter = express.Router();

orderRouter.post("/create-order",isAuthenticated,createOrder);
orderRouter.get("/get-all-orders",isAuthenticated,roleAuthenticate("admin"),getAllOrders);
orderRouter.get("/payment/stripePublishableKey", sendStripePublicKey)
orderRouter.post("/payment",isAuthenticated,newPayment)
module.exports = orderRouter