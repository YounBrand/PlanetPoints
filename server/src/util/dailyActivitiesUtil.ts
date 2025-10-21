import {IActivity, User} from "../schemas/User"

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

const logActivity = async (userId: string, activity: ActivityType, unit: Number): Promise<LogActivityResponse> => {
    try {
        const user = await User.findOne({_id: userId});
        if (!user) return {success: false, message: "User not found"};
    
        user.activities.push({
            activity,
            unit,
            date: new Date(),
        });
    
        await user.save();
    
        return { success: true, message: `Logged activity for user ${userId}` };
    } catch (err) {
        console.log(err);
        return { success: false, message: `Activity could not be logged for user ${userId}, ${err} ` };
    }
}

interface ActivityFilterParams {
    dateFrom?: Date;
    dateTo?: Date;
    unitFrom?: number;
    unitTo?: number;
}

interface GetActivitiesResponse {
    success: boolean;
    message: string;
    data?: any[];
}

const getActivities = async (userId: string, activity: ActivityType, filterParams: ActivityFilterParams): Promise<GetActivitiesResponse> => {
    try {
        const user = await User.findOne({_id: userId})
        if (!user) return {success: false, message: "User not found"};

        const { dateFrom, dateTo, unitFrom, unitTo } = filterParams;

        const activities = (user.activities as IActivity[]).filter(a => {
            const withinActivity = a.activity === activity;
            const withinDate =
              (!dateFrom || a.date >= dateFrom) &&
              (!dateTo || a.date <= dateTo);
            const withinUnit =
              (!unitFrom || a.unit >= unitFrom) &&
              (!unitTo || a.unit <= unitTo);
            return withinActivity && withinDate && withinUnit;
          });
        return { success: true, message: "Activities retrieved", data: activities };
    }catch(err) {
        console.log(err);
        return {success: false, message: `Could not obtain activities for user ${userId}, ${err}`}
    }
}

export {isActivityType, ActivityType, LogActivityResponse, logActivity, getActivities};