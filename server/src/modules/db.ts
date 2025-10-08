import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.error("No database URL found");
    return;
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Could not connect to MongoDB ", err);
  }
};

export default connectDB;
