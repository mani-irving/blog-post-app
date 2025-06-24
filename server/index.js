// Load environment variables from .env file before anything else
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // Ensures process.env is populated

// Import the MongoDB connection function
import connectDB from "./db/index.js";

// Import the Express app instance
import app from "./app.js";

// Attempt to connect to MongoDB, then start the Express server
connectDB()
  .then(() => {
    // Start server after successful DB connection
    app.listen(process.env.PORT || 8000, () => {
      console.log(`✅ Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    // Log any DB connection errors and gracefully exit
    console.error("❌ MongoDB connection failed!", error);
    process.exit(1); // Optional: Exit app if DB connection fails
  });
