import { IActivity, User } from "../schemas/User";

enum ActivityType {
  RecycleBoxes = "RecycleBoxes",
  RoomTemperature = "RoomTemperature",
  MilesTravelled = "MilesTravelled",
}

const isActivityType = (value: string): value is ActivityType => {
  return (Object.values(ActivityType) as string[]).includes(value);
};

interface LogActivityResponse {
  success: boolean;
  message: string;
}

const logActivity = async (
  userId: string,
  activity: ActivityType,
  unit: Number
): Promise<LogActivityResponse> => {
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) return { success: false, message: "User not found" };

    user.activities.push({
      activity,
      unit,
      date: new Date(),
    });

    await user.save();

    return { success: true, message: `Logged activity for user ${userId}` };
  } catch (err) {
    console.log(err);
    return {
      success: false,
      message: `Activity could not be logged for user ${userId}, ${err} `,
    };
  }
};

interface ActivityFilterParams {
  dateFrom?: Date;
  dateTo?: Date;
  unitFrom?: number;
  unitTo?: number;
}

type GetActivitiesResponse =
  | { success: true; data: any[] }
  | { success: false; message: string };

const getActivities = async (
  userId: string,
  activity: ActivityType,
  filterParams: ActivityFilterParams
): Promise<GetActivitiesResponse> => {
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) return { success: false, message: "User not found" };

    const { dateFrom, dateTo, unitFrom, unitTo } = filterParams;

    const activities = (user.activities as IActivity[]).filter((a) => {
      const withinActivity = a.activity === activity;
      const withinDate =
        (!dateFrom || a.date >= dateFrom) && (!dateTo || a.date <= dateTo);
      const withinUnit =
        (!unitFrom || a.unit >= unitFrom) && (!unitTo || a.unit <= unitTo);
      return withinActivity && withinDate && withinUnit;
    });
    return { success: true, data: activities };
  } catch (err) {
    console.log(err);
    return {
      success: false,
      message: `Could not obtain activities for user ${userId}, ${err}`,
    };
  }
};

type GetActivityUnitResponse =
  | {
      success: true;
      score: number;
    }
  | { success: false; message: string };

const getActivityUnit = async (
  userId: string,
  activity: ActivityType,
  dateFrom: Date,
  dateTo: Date
): Promise<GetActivityUnitResponse> => {
  const filterParams = {
    dateFrom: dateFrom,
    dateTo: dateTo,
    unitFrom: undefined,
    unitTo: undefined,
  };
  const activitiesData = await getActivities(userId, activity, filterParams);
  if (!activitiesData.success)
    return { success: false, message: activitiesData.message };

  let total = 0;
  activitiesData.data.forEach((item) => {
    total += item.unit;
  });
  return { success: true, score: total };
};

type GetDailyScoreResponse =
  | { success: true; score: number }
  | { success: false; message: string };

const getDailyScore = async (
  userId: string,
  date: Date
): Promise<GetDailyScoreResponse> => {
  const dateFrom = new Date(date);
  dateFrom.setDate(date.getDate() - 1);

  const recycleBoxesScore = await getActivityUnit(
    userId,
    ActivityType.RecycleBoxes,
    dateFrom,
    date
  );
  if (!recycleBoxesScore.success)
    return { success: false, message: recycleBoxesScore.message };

  const roomTemperatureScore = await getActivityUnit(
    userId,
    ActivityType.RoomTemperature,
    dateFrom,
    date
  );
  if (!roomTemperatureScore.success)
    return { success: false, message: roomTemperatureScore.message };

  const milesTravelledScore = await getActivityUnit(
    userId,
    ActivityType.MilesTravelled,
    dateFrom,
    date
  );
  if (!milesTravelledScore.success)
    return { success: false, message: milesTravelledScore.message };

  const finalDailyScore =
    recycleBoxesScore.score * 0.4 +
    (72 - roomTemperatureScore.score) * 0.3 +
    milesTravelledScore.score * 0.3;

  return {
    success: true,
    score: finalDailyScore,
  };
};

type GetMonthlyScoreResponse =
  | { success: true; score: number }
  | { success: false; message: string };

const GetMonthlyScore = async (
  userId: string,
  date: Date
): Promise<GetMonthlyScoreResponse> => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const recycleBoxesScore = await getActivityUnit(
    userId,
    ActivityType.RecycleBoxes,
    startOfMonth,
    endOfMonth
  );
  if (!recycleBoxesScore.success)
    return { success: false, message: recycleBoxesScore.message };

  const roomTemperatureScore = await getActivityUnit(
    userId,
    ActivityType.RoomTemperature,
    startOfMonth,
    endOfMonth
  );
  if (!roomTemperatureScore.success)
    return { success: false, message: roomTemperatureScore.message };

  const milesTravelledScore = await getActivityUnit(
    userId,
    ActivityType.MilesTravelled,
    startOfMonth,
    endOfMonth
  );
  if (!milesTravelledScore.success)
    return { success: false, message: milesTravelledScore.message };

  const finalMonthlyScore =
    recycleBoxesScore.score * 0.4 +
    (72 - roomTemperatureScore.score) * 0.3 +
    milesTravelledScore.score * 0.3;

  return {
    success: true,
    score: finalMonthlyScore,
  };
};

export {
  isActivityType,
  ActivityType,
  LogActivityResponse,
  logActivity,
  getActivities,
  getDailyScore,
  GetMonthlyScore,
};
