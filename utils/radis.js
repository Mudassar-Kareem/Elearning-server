const Redis = require('ioredis');
require('dotenv').config();

const redistClient = () => {
    if (process.env.REDIS_URL) {
        console.log('Redis Connected');
        return process.env.REDIS_URL;
    }
    throw new Error('Redis connection failed');
};

const redis = new Redis(redistClient());

module.exports = { redis };
