import dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import loginRoutes from "./routes/authRoutes.js";
import activitiesRoute from "./routes/activitiesRoutes.js";
import connectDB from "./modules/db.js";
import fastifyPassport from "@fastify/passport";
import fastifySecureSession from "@fastify/secure-session";
import { identityStrategy } from "./modules/passport.js";

const server = Fastify();
const port = Number(process.env.PORT) || 3000;

// Connect to DB
await connectDB();

server.register(fastifySecureSession, {
  key: Buffer.from(process.env.SESSION_KEY || "session-key", "hex"),
});

server.register(fastifyPassport.initialize());
server.register(fastifyPassport.secureSession());

fastifyPassport.use("identity", identityStrategy);

server.register(loginRoutes);
server.register(activitiesRoute);

server.listen({ port: port}, function (err) {
  console.log(`Server started and listening on port ${port}.`);
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});

export default server;
