import Fastify from "fastify";
import loginRoutes from "./routes/authRoutes.js";

const server = Fastify();
const port = Number(process.env.PORT) || 3000;

server.register(loginRoutes);

server.listen({ port: port }, function (err) {
  console.log(`Server started and listening on port ${port}.`);
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});

export default server;
