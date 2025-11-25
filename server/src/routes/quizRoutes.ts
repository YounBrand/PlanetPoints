import type { FastifyInstance } from "fastify";
import { generateQuiz } from "../util/quizUtil";

const routes = async (fastify: FastifyInstance) => {
  // Generate Quiz Route
  fastify.post("/api/quiz", async (req, reply) => {
    const { topic } = req.body as {
      topic?: string;
    };
    const quizTopic = topic || "carbon footprint";
    const result = await generateQuiz(quizTopic);
    if (!result.success) {
      return reply.code(500).send({ error: result.message });
    }
    return reply.code(200).send({ quiz: result.data });
  });
};

export default routes;