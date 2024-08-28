const express = require("express");
const { isAuthenticated, roleAuthenticate } = require("../middleware/auth");
const { createLayout, editLayout, getLayout } = require("../controllers/layout-controller");

const layoutRoutes = express.Router();

layoutRoutes.post("/create-layout",isAuthenticated,roleAuthenticate("admin"),createLayout);
layoutRoutes.put("/edit-layout",isAuthenticated,roleAuthenticate("admin"),editLayout);
layoutRoutes.get("/get-layout/:type",getLayout);

module.exports = layoutRoutes;