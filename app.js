require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { ErrorMiddleware } = require('./middleware/error');
const userRouter = require('./router/user-route');
const courseRouter = require('./router/course-route');
const orderRouter = require('./router/order-routes');
const { notificationRouter } = require('./router/notification-routes');
const analyticRoutes = require('./router/analytics-routes');
const layoutRoutes = require('./router/layout-routes');
const{ rateLimit } = require('express-rate-limit')
const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));

// Cookie parser
app.use(cookieParser());

// CORS
const corsOptions = {
    origin: 'http://localhost:3000', // Allow only this origin
    optionsSuccessStatus: 200, // For legacy browser support
    credentials: true, // Enable to allow cookies
  };
  
  app.use(cors(corsOptions));

  const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})

// Routes
app.use('/api/v1', userRouter);
app.use('/api/v1',courseRouter);
app.use('/api/v1',orderRouter);
app.use('/api/v1',notificationRouter);
app.use('/api/v1',analyticRoutes);
app.use('/api/v1',layoutRoutes);

// Testing API
app.get('/test', (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'API is working'
    });
});

// Unknown route
app.all('*', (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
app.use(limiter)
app.use(ErrorMiddleware);

module.exports = { app };
