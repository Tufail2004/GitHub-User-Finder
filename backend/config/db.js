// config/db.js
// Connects to MongoDB Atlas with Mongoose.
// The server must NOT crash if no database is configured:
// if MONGODB_URI is empty or the connection fails, we log a warning
// and keep running. Tracking endpoints then return a graceful
// "stored: false, reason: database not connected" response.
const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[db] MONGODB_URI is not set. Running without a database.");
    return false;
  }
  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("[db] MongoDB connected");
    return true;
  } catch (err) {
    isConnected = false;
    console.warn("[db] MongoDB connection failed, running without a database:", err.message);
    return false;
  }
}

function dbConnected() {
  // mongoose.readyState === 1 means connected
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = { connectDB, dbConnected };
