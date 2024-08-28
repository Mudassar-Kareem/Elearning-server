const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    title:{
        type: String,
        required:true
    },
    message:{
        type: String,
        required:true
    },
    status: {
        type: String,
        required:true,
        default:"unread"
    }
},{timestamps:true});

const notificationModel = mongoose.model("Notification",notificationSchema);
module.exports = notificationModel;