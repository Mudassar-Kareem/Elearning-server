const { NextFunction, Request, Response } = require('express');

const CatchAsyncError = (theFunc) => (req, res, next) => {
  Promise.resolve(theFunc(req, res, next)).catch(next);
};

module.exports = { CatchAsyncError };
