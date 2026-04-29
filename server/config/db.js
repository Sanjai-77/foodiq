const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔍 MONGO_URI:", process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1); // Prevent Silent Failures
  }
};

module.exports = connectDB;
