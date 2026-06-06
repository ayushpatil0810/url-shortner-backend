import 'dotenv/config.js';
import msConverter from '../utils/msConverter.js';
import { type StringValue } from 'ms';

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'APP_BASE_URL',
  'MAILTRAP_HOST',
  'MAILTRAP_PORT',
  'MAILTRAP_USER',
  'MAILTRAP_PASS',
  'REDIS_URL',
  'REDIS_HOST',
  'REDIS_PORT',
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnvVars.join(', ')}`,
  );
  console.error(
    'Please check your .env file and ensure all required variables are set.',
  );
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL as string;
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS as string, 10) || 10;
const CORS_ORIGIN = process.env.CORS_ORIGIN as string;
const APP_BASE_URL = process.env.APP_BASE_URL as string;
const APP_NAME = process.env.APP_NAME || 'Your App';
const APP_WEBSITE = process.env.APP_WEBSITE || 'https://yourapp.com';
const REDIS_URL = process.env.REDIS_URL as string;
const REDIS_HOST = process.env.REDIS_HOST as string;
const REDIS_PORT = parseInt(process.env.REDIS_PORT as string, 10) || 6379;

const ACCESS_TOKEN_CONFIG = {
  secret: process.env.ACCESS_TOKEN_SECRET as string,
  expiresIn: (process.env.ACCESS_TOKEN_EXPIRY as string) || '15m', // JWT expects string format
  expiresInMs: msConverter(
    (process.env.ACCESS_TOKEN_EXPIRY as StringValue) || '15m',
  ), // For cookie maxAge
};

const REFRESH_TOKEN_CONFIG = {
  secret: process.env.REFRESH_TOKEN_SECRET as string,
  expiresIn: (process.env.REFRESH_TOKEN_EXPIRY as string) || '7d', // JWT expects string format
  expiresInMs: msConverter(
    (process.env.REFRESH_TOKEN_EXPIRY as StringValue) || '7d',
  ), // For cookie maxAge and DB storage
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
  SALT_ROUNDS,
  CORS_ORIGIN,
  MAILTRAP_CONFIG,
  ACCESS_TOKEN_CONFIG,
  REFRESH_TOKEN_CONFIG,
  APP_BASE_URL,
  APP_NAME,
  APP_WEBSITE,
  REDIS_URL,
  REDIS_HOST,
  REDIS_PORT,
};
