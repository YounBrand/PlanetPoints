import Fastify from "fastify";
import loginRoutes from "./routes/authRoutes.js";

const server = Fastify();
const port = Number(process.env.PORT) || 3000;

await server.register(loginRoutes);

server.listen({ port: port }, function (err) {
  console.log(`Server started and listening on port ${port}.`);
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
