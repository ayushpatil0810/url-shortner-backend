import express, { type Application } from "express";
import { CORS_ORIGIN } from "./config/env.js";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";

const app: Application = express();

// Security headers
app.use(helmet());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// CORS configuration
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Authorization",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

app.use("/api/v1/auth", authRouter);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
