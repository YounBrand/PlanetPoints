import type { FastifyInstance } from "fastify";
import User from "../schemas/User.js";

const routes = async (fastify: FastifyInstance) => {
  fastify.get("/api/login/test", async () => {
    // Testing db write
    const newUser = new User({
      username: "PleaseWork",
      password: "VerySecretPassword",
      email: "coolemail@gmail.com",
      name: "John Doe",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newUser.save();
    console.log("User saved");

    return { message: "hello world" };
  });
};

export default routes;
