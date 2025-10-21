import mongoose, {Document} from "mongoose";
import { ActivityType } from "../util/dailyActivitiesUtil";

interface IActivity {
  activity: ActivityType;
  unit: number;
  date: Date;
}

interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
  email: string;
  name: string;
  activities: IActivity[];
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new mongoose.Schema({
  activity: {
    type: String,
    enum: Object.values(ActivityType)
  },
  unit: Number,
  date: Date,
});


const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  name: String,
  activities: { type: [activitySchema], default: [] },
  createdAt: Date,
  updatedAt: Date,
});
const User = mongoose.model("User", userSchema);

export {User, IUser, IActivity};
