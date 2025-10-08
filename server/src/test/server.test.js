import dotenv from "dotenv";
dotenv.config();

import { test, expect } from "vitest";
import request from "supertest";
import server from "../server";

test("GET /api/helloworld returns 'Hello world'", async () => {
  await server.ready();

  const res = await request(server.server).get("/api/login/test");
  expect(res.statusCode).toBe(200);
  expect(res.body.message).toBe("hello world");
});
