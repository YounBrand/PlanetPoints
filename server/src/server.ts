import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import Fastify from "fastify";
import loginRoutes from "./routes/authRoutes.js";
import activitiesRoute from "./routes/activitiesRoutes.js";
import connectDB from "./modules/db.js";
import fastifyPassport from "@fastify/passport";
import fastifySecureSession from "@fastify/secure-session";
import { identityStrategy } from "./modules/passport.js";
import cors from "@fastify/cors";

const server = Fastify();
const port = Number(process.env.PORT) || 3000;

server.register(cors, {
  origin: ["http://localhost:5173", "https://planetpoints.onrender.com"],
  credentials: true,
});

// Connect to DB
await connectDB();

if (!process.env.SESSION_KEY) {
  throw new Error("SESSION_KEY must be set in environment variables");
}

server.register(fastifySecureSession, {
  key: Buffer.from(process.env.SESSION_KEY, "hex"),
});

// Root route
server.get("/", async (request, reply) => {
  return reply.code(200).send({ message: "PlanetPoints API root" });
});

server.register(fastifyPassport.initialize());
server.register(fastifyPassport.secureSession());

fastifyPassport.use("identity", identityStrategy);

server.register(loginRoutes);
server.register(activitiesRoute);

if (process.env.NODE_ENV !== "test") {
  server.listen({ port: port, host: "0.0.0.0" }, function (err, address) {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
    console.log(`Server started and listening on ${address}.`);
  });
}

export default server;
