// Import the Mongoose library to interact with MongoDB
import mongoose from "mongoose";

// Async function to establish a MongoDB connection
const connectDB = async () => {
  // Validate presence of required environment variables before attempting connection
  if (!process.env.MONGODB_URI || !process.env.DB_NAME) {
    console.error("❌ Missing MONGODB_URI or DB_NAME in environment variables");
    process.exit(1); // Exit process with failure code
  }

  try {
    // Attempt to connect to MongoDB using Mongoose
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME}`, // Construct full DB URI dynamically
      {
        useNewUrlParser: true, // Use modern URL string parser (avoids deprecation warnings)
        useUnifiedTopology: true, // Use new topology engine for more robust connection handling
      }
    );

    // Log successful connection details (useful for debugging and monitoring)
    console.log(
      `\n✅ MongoDB connected! DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    // Catch and log any errors that occur during connection attempt
    console.error("❌ MongoDB connection FAILED:", error);
    process.exit(1); // Exit process if connection fails
  }
};

// Export the connectDB function to be used in entry point (e.g., index.js)
export default connectDB;
