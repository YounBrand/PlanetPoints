import type { FastifyInstance } from "fastify";
import User from "../schemas/User.js";
import bcrypt from "bcrypt";
import FastifyPassport from "@fastify/passport";

const routes = async (fastify: FastifyInstance) => {
  fastify.get("/api/login/test", async (req, reply) => {
    return reply.code(200).send({ message: "hello world" });
  });

  fastify.post("/api/register", async (req, reply) => {
    const { username, password, email, name } = req.body as {
      username: string;
      password: string;
      email: string;
      name: string;
    };

    if (!username || !password || !email || !name) return reply.code(400).send({message: "Username, password, email and name are required"});

    let user = await User.findOne({email});
    if (user) return reply.code(409).send({message: "Email already in use"});

    user = await User.findOne({username});
    if (user) return reply.code(409).send({message: "Username already in use"});

    const encrypted = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: username,
      password: encrypted,
      email: email,
      name: name,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newUser.save();
    return reply.code(200).send({message: "User successfully created"});
  })

  fastify.post(
    "/api/login",
    {
      preValidation: FastifyPassport.authenticate("identity", {
        session: false,
        authInfo: false,
        failWithError: true,
      }),
    },
    async (req, reply) => {
      return reply.send({ message: "Login successful", user: req.user });
    }
  );

  fastify.setErrorHandler((err, req, reply) => {
    if (err && err.message) {
      return reply.code(401).send({ message: err.message });
    }
    reply.code(500).send({ message: "Internal server error" });
  });
  
};

export default routes;
