const mongoose = require('mongoose');
require('dotenv').config();

// Ensure your DB_URL is set correctly in your .env file
const dbUrl = process.env.DB_URL || '';

const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl, {
            // Use these options if you are dealing with TLS/SSL
            tls: true,
            tlsAllowInvalidCertificates: true, // Allow self-signed certs
            tlsAllowInvalidHostnames: true, // Allow invalid hostnames in certs
        });

        console.log(`Database is connected with ${mongoose.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error.message);
        // Retry connection after 5 seconds if an error occurs
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;
