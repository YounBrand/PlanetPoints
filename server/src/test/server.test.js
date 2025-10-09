import { beforeAll, beforeEach, afterAll, describe, test, expect } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import server from "../server.js";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await server.ready();

  const dbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/testdb";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(dbUri);
  }
  // Clear users collection before starting tests
  await mongoose.connection.collection("users").deleteMany({});
});

beforeEach(async () => {
  // Clear users collection before each test
  await mongoose.connection.collection("users").deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await server.close();
});

describe("Server Tests", () => {
  test("GET /api/login/test returns 'hello world'", async () => {
    const res = await request(server.server).get("/api/login/test");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("hello world");
  });

  test("POST /api/login should successfully login with valid username and password", async () => {
    const userData = {
      username: "testuser",
      password: "password123",
      email: "test@example.com",
      name: "Test User",
    };

    // Register user first
    const registerRes = await request(server.server)
      .post("/api/register")
      .send(userData);

    expect(registerRes.statusCode).toBe(200);

    // Then login with the same credentials
    const res = await request(server.server)
      .post("/api/login")
      .send({
        identity: userData.username,
        password: userData.password,
      });

    if (res.statusCode !== 200) {
      console.error("Login failed:", res.statusCode, res.body);
    }

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Login successful");
    expect(res.body.user).toBeDefined();
  });

  test("POST /api/login should successfully login with valid email and password", async () => {
    const userData = {
      username: "testuser",
      password: "password123",
      email: "test@example.com",
      name: "Test User",
    };

    // Register user first
    const registerRes = await request(server.server)
      .post("/api/register")
      .send(userData);

    expect(registerRes.statusCode).toBe(200);

    // Then login with the same credentials
    const res = await request(server.server)
      .post("/api/login")
      .send({
        identity: userData.email,
        password: userData.password,
      });

    if (res.statusCode !== 200) {
      console.error("Login failed:", res.statusCode, res.body);
    }

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Login successful");
    expect(res.body.user).toBeDefined();
  });

test("POST /api/login should fail with invalid password", async () => {
  const userData = {
    username: "testuser",
    password: "password123",
    email: "test@example.com",
    name: "Test User",
  };

  // Register user first
  await request(server.server)
    .post("/api/register")
    .send(userData)
    .expect(200);

  // Then attempt to login with wrong password
  const res = await request(server.server)
    .post("/api/login")
    .send({
      identity: userData.username,
      password: "wrongpassword",
    });

  expect(res.statusCode).toBe(401);
  expect(res.body.message).toMatch(/invalid|wrong|password/i);
  });
});
