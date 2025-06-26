import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { BODY_LIMIT } from "./config/constants.js"; // centralized config for limits

const app = express();

// Enable CORS for frontend communication
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000", // fallback
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // explicitly defined
  })
);

// Parse incoming JSON with size limit
app.use(express.json({ limit: BODY_LIMIT }));

// Parse form-data (URL-encoded)
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// Serve static files from /public
app.use(express.static("public"));

// Parse cookies
app.use(cookieParser());

//  Import & Mount Routes
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);

export default app;
