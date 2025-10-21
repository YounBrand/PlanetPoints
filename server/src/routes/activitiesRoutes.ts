import type { FastifyInstance } from "fastify";
import { User } from "../schemas/User.js";
import { isActivityType, logActivity, getActivities } from "../util/dailyActivitiesUtil.js";
import { verifyApiKey } from "../util/authUtil.js";

const routes = async (fastify: FastifyInstance) => {
  fastify.post("/api/activities/log-daily", async (req, reply) => {

    const key = req.headers["x-api-key"];
    if (!verifyApiKey(key as string)) return reply.code(403).send({ message: "Forbidden" }); 

    const { userId, activity, unit } = req.body as { userId: string, activity: string, unit: number };

    const user = await User.findOne({ _id: userId })
    if (!user)
      return reply.code(401).send({ message: "User not found" });

    if (!activity)
      return reply.code(400).send({ message: "You must specify an activity type" });

    if (!unit) return reply.code(400).send({ message: "You must specify the units"});

    if (!isActivityType(activity)) return reply.code(400).send({message: "Invalid activity type"});

    const result = await logActivity(user._id.toString(), activity, unit);
    if (result.success == true) return reply.code(200).send({ message: "Activity logged successfully" });

    return reply.code(400).send({message: result.message});
  });

  fastify.get("/api/activities/get", async (req, reply) => {
    const key = req.headers["x-api-key"];
    if (!verifyApiKey(key as string)) return reply.code(403).send({ message: "Forbidden" }); 

    const {userId, activity, dateFrom, dateTo, unitFrom, unitTo} = req.query as {
      userId: string,
      activity: string,
      dateFrom?: string,
      dateTo?: string,
      unitFrom?: string,
      unitTo?: string,
    }

    if (!userId) return reply.code(400).send({ message: "You must provide a userId" });

    if (!activity)
      return reply.code(400).send({ message: "You must specify an activity type" });

    if (!isActivityType(activity)) return reply.code(400).send({message: "Invalid activity type"});

    const filterParams = {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      unitFrom: unitFrom ? Number(unitFrom) : undefined,
      unitTo: unitTo ? Number(unitTo) : undefined,
    };

    const result = await getActivities(userId, activity, filterParams);

    if (!result.success) return reply.code(400).send({ message: result.message });

    return reply.code(200).send(result);
  })
};

export default routes;
