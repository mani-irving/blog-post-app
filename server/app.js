import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { BODY_LIMIT } from "./config/constants.js"; // centralized config for limits

const app = express();

// Enable Cross-Origin Resource Sharing (CORS) to allow frontend communication
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // frontend origin, e.g. http://localhost:3000
    credentials: true, // allows cookies to be sent with requests
  })
);

// Parse incoming JSON requests (with body size limit)
app.use(express.json({ limit: BODY_LIMIT }));

// Parse form-data (x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// Serve static files (e.g. images, HTML) from 'public' directory
app.use(express.static("public"));

// Parse cookies in incoming requests
app.use(cookieParser());

// Mount user-related API routes under versioned path
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);

// Export the configured app instance to be used in index.js
export default app;
