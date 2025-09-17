import type { FastifyInstance } from "fastify";

const routes = async (fastify: FastifyInstance) => {
  fastify.get("/api/login/test", async () => {
    return { message: "hello world" };
  });
};

export default routes;
