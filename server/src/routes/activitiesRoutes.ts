import type { FastifyInstance } from "fastify";
import { User } from "../schemas/User.js";
import {
  isActivityType,
  logActivity,
  getActivities,
  getScore,
  getLeaderboard,
} from "../util/dailyActivitiesUtil.js";

const routes = async (fastify: FastifyInstance) => {
  // Log daily route
  fastify.post("/api/activities/log-daily", async (req, reply) => {
    const { userId, activity, unit } = req.body as {
      userId: string;
      activity: string;
      unit: number;
    };

    const user = await User.findOne({ _id: userId });
    if (!user) return reply.code(401).send({ message: "User not found" });

    if (!activity)
      return reply
        .code(400)
        .send({ message: "You must specify an activity type" });

    if (!unit)
      return reply.code(400).send({ message: "You must specify the units" });

    if (!isActivityType(activity))
      return reply.code(400).send({ message: "Invalid activity type" });

    const result = await logActivity(user._id.toString(), activity, unit);
    if (result.success == true)
      return reply.code(200).send({ message: "Activity logged successfully" });

    return reply.code(400).send({ message: result.message });
  });

  // Get activity route
  fastify.get("/api/activities/get", async (req, reply) => {
    const { userId, activity, dateFrom, dateTo, unitFrom, unitTo } =
      req.query as {
        userId: string;
        activity: string;
        dateFrom?: string;
        dateTo?: string;
        unitFrom?: string;
        unitTo?: string;
      };

    if (!userId)
      return reply.code(400).send({ message: "You must provide a userId" });

    if (!activity)
      return reply
        .code(400)
        .send({ message: "You must specify an activity type" });

    if (!isActivityType(activity))
      return reply.code(400).send({ message: "Invalid activity type" });

    const filterParams = {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      unitFrom: unitFrom ? Number(unitFrom) : undefined,
      unitTo: unitTo ? Number(unitTo) : undefined,
    };

    const result = await getActivities(userId, activity, filterParams);

    if (!result.success)
      return reply.code(400).send({ message: result.message });

    return reply.code(200).send(result);
  });

  // Calcualte score route
  fastify.get("/api/activities/calculate-score", async (req, reply) => {
    const { userId, dateFrom, dateTo } = req.query as {
      userId: string;
      dateFrom: string;
      dateTo: string;
    };

    if (!userId || !dateFrom || !dateTo) {
      return reply
        .code(400)
        .send({ message: "userId, dateFrom and dateTo are required" });
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const calculateDailyResponse = await getScore(userId, from, to);
    if (!calculateDailyResponse.success) {
      return reply.code(500).send({ message: calculateDailyResponse.message });
    }

    return reply.code(200).send(calculateDailyResponse.score);
  });

  // Leaderboard route
  fastify.get("/api/activities/get-leaderboard", async (req, reply) => {
    const { dateFrom, dateTo } = req.query as {
      dateFrom: string;
      dateTo: string;
    };

    if (!dateFrom || !dateTo) {
      return reply
        .code(400)
        .send({ message: "dateFrom and dateTo are required" });
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const getLeaderboardResponse = await getLeaderboard(from, to);
    if (!getLeaderboardResponse.success) {
      return reply.code(500).send({ message: getLeaderboardResponse.message });
    }

    return reply.code(200).send(getLeaderboardResponse.data);
  });
};

export default routes;
