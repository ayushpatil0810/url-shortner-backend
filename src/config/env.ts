import "dotenv/config.js";
import msConverter from "../utils/msConverter.js";
import { type StringValue } from "ms";

const DATABASE_URL = process.env.DATABASE_URL as string;
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET as string;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS as string, 10) || 10;
const CORS_ORIGIN = process.env.CORS_ORIGIN as string;
const APP_BASE_URL = process.env.APP_BASE_URL as string;
const APP_NAME = process.env.APP_NAME || "Your App";
const APP_WEBSITE = process.env.APP_WEBSITE || "https://yourapp.com";

const ACCESS_TOKEN_CONFIG = {
  secret: process.env.ACCESS_TOKEN_SECRET as string,
  expiresIn:
    msConverter(process.env.ACCESS_TOKEN_EXPIRY as StringValue) || 3600000, // Default to 1 hour if not set,
};

const REFRESH_TOKEN_CONFIG = {
  secret: process.env.REFRESH_TOKEN_SECRET as string,
  expiresIn:
    msConverter(process.env.REFRESH_TOKEN_EXPIRY as StringValue) || 604800000, // Default to 7 days if not set,
};

const MAILTRAP_CONFIG = {
  host: process.env.MAILTRAP_HOST as string,
  port: parseInt(process.env.MAILTRAP_PORT as string, 10) || 2525,
  auth: {
    user: process.env.MAILTRAP_USER as string,
    pass: process.env.MAILTRAP_PASS as string,
  },
};

export {
  DATABASE_URL,
  PORT,
  JWT_SECRET,
  SALT_ROUNDS,
  CORS_ORIGIN,
  MAILTRAP_CONFIG,
  ACCESS_TOKEN_CONFIG,
  REFRESH_TOKEN_CONFIG,
  APP_BASE_URL,
  APP_NAME,
  APP_WEBSITE,
};
