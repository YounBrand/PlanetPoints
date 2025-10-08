import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  name: String,
  createdAt: Date,
  updatedAt: Date,
});

const User = mongoose.model("User", userSchema);

export default User;
