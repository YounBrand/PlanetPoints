import type { FastifyInstance } from "fastify";
import { generateQuiz } from "../util/quizUtil"; 

const quizRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/api/quiz", async (req, reply) => {
    const { topic = "carbon footprint" } = req.body as { topic?: string };

    try {
      const quiz = await generateQuiz(topic); 
      return reply.code(200).send({ quiz }); 
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send({ error: err.message || "Quiz generation failed" });
    }
  });
};

export default quizRoutes;