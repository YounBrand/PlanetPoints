import { IActivity, User } from "../schemas/User";

enum ActivityType {
  RecycleBoxes = "RecycleBoxes",
  RoomTemperature = "RoomTemperature",
  MilesTravelled = "MilesTravelled",
  QuizCompleted = "QuizCompleted",
}

const isActivityType = (value: string): value is ActivityType => {
  return (Object.values(ActivityType) as string[]).includes(value);
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

interface LogActivityResponse {
  success: boolean;
  message: string;
}

const logActivity = async (
  userId: string,
  activity: ActivityType,
  unit: number
): Promise<LogActivityResponse> => {
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) return { success: false, message: "User not found" };

    if (activity === ActivityType.RoomTemperature) {
      const todayFrom = new Date();
      todayFrom.setHours(0, 0, 0, 0);
      const todayTo = new Date();
      todayTo.setHours(23, 59, 59, 999);

      const tempToday = await getActivities(
        userId,
        ActivityType.RoomTemperature,
        {
          dateFrom: todayFrom,
          dateTo: todayTo,
        }
      );

      if (!tempToday.success)
        return {
          success: false,
          message: `Activity could not be logged for user ${userId}, ${tempToday.message} `,
        };

      if (tempToday.data.length > 0) {
        const existing = tempToday.data[0];

        const existingTemperatureIndex = user.activities.findIndex((a) =>
          a._id.equals(existing._id)
        );

        if (existingTemperatureIndex === -1) {
          return {
            success: false,
            message: `Activity could not be logged for user ${userId} `,
          };
        }

        user.activities[existingTemperatureIndex].activity = activity;
        user.activities[existingTemperatureIndex].unit = unit;
        user.activities[existingTemperatureIndex].date = new Date();

        await user.save();
        return { success: true, message: `Updated today's temperature` };
      }
    }
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

type getScoreResponse =
  | { success: true; score: number }
  | { success: false; message: string };

const getScore = async (
  userId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<getScoreResponse> => {
  const recycleBoxesScore = await getActivityUnit(
    userId,
    ActivityType.RecycleBoxes,
    dateFrom,
    dateTo
  );
  if (!recycleBoxesScore.success)
    return { success: false, message: recycleBoxesScore.message };

  const roomTemperatureScore = await getActivityUnit(
    userId,
    ActivityType.RoomTemperature,
    dateFrom,
    dateTo
  );
  if (!roomTemperatureScore.success)
    return { success: false, message: roomTemperatureScore.message };

  const milesTravelledScore = await getActivityUnit(
    userId,
    ActivityType.MilesTravelled,
    dateFrom,
    dateTo
  );
  if (!milesTravelledScore.success)
    return { success: false, message: milesTravelledScore.message };

  const quizCompletedScore = await getActivityUnit(
    userId,
    ActivityType.QuizCompleted,
    dateFrom,
    dateTo
  );
  if(!quizCompletedScore.success)
    return { success: false, message: quizCompletedScore.message }

  const tempDiff = Math.abs(roomTemperatureScore.score - 72);
  const tempScore = Math.max(0, 72 - tempDiff);

  const finalDailyScore =
    recycleBoxesScore.score + tempScore + milesTravelledScore.score + quizCompletedScore.score;

  return {
    success: true,
    score: finalDailyScore,
  };
};

interface LeaderboardUser {
  username: string;
  score: number;
  rank: number;
}

type getLeaderboardResponse =
  | { success: true; data: LeaderboardUser[] }
  | { success: false; message: string };

const getLeaderboard = async (
  dateFrom: Date,
  dateTo: Date
): Promise<getLeaderboardResponse> => {
  try {
    const users = await User.find({});

    const leaderboard: LeaderboardUser[] = [];

    for (const u of users) {
      if (!u.username) continue;
      const score = await getScore(u._id.toString(), dateFrom, dateTo);

      if (!score.success) {
        return { success: false, message: score.message };
      }

      leaderboard.push({
        username: u.username,
        score: score.score,
        rank: 0,
      });
    }

    leaderboard.sort((a, b) => b.score - a.score);

    const rankedLeaderboard = leaderboard.map((user, i) => ({
      ...user,
      rank: i + 1,
    }));

    return { success: true, data: rankedLeaderboard };
  } catch (err) {
    console.log(err);
    return {
      success: false,
      message: `Unable to get leaderboard, ${err}`,
    };
  }
};

export {
  isActivityType,
  ActivityType,
  LogActivityResponse,
  logActivity,
  getActivities,
  getScore,
  getLeaderboard,
};
