import { type Response } from "express";

const sendSuccess = (
  res: Response,
  data: unknown = null,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (
  res: Response,
  message = "Something went wrong",
  statusCode = 500,
  errors = null,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export { sendSuccess, sendError };
