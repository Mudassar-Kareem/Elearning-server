const { app } = require('./app');
const { initSocketServer } = require('./socketServer');
const connectDB = require('./utils/db');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const http = require("http")
connectDB();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_API_KEYS, 
  api_secret: process.env.CLOUD_SECRET,
});
const server = http.createServer(app);

// Test the configuration
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('Cloudinary configuration error:', error);
  } else {
    console.log('Cloudinary configuration successful:', result);
  }
});
initSocketServer(server);
// Create server
server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    
});
