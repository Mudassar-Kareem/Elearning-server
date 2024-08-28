const { NextFunction, Request, Response } = require('express');
const ErrorHandler = require('../utils/ErrorHandler');

const ErrorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Wrong MongoDB id error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Duplicate key error
  if (err.code === 11000) {
    // MongoDB duplicate key error code
    const message = `Duplicate key error. Value: ${Object.keys(err.keyValue)}`;
    err = new ErrorHandler(message, 400);
  }

  // Wrong JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'JSON web token is invalid, try again';
    err = new ErrorHandler(message, 400);
  }

  // JWT Expiration Error
  if (err.name === 'TokenExpiredError') {
    const message = 'JWT has expired. Please log in again.';
    err = new ErrorHandler(message, 401);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

module.exports = { ErrorMiddleware };
