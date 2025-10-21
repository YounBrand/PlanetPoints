import dotenv from "dotenv";
dotenv.config();

import { describe, test, expect, afterEach } from "vitest";
import request from "supertest";
import server from "../server";
import connectDB from "../modules/db.js";
import {User} from "../schemas/User.js";

// Ensure DB is connected before tests
await connectDB();

describe("Server Tests", () => {
  const userData = {
    username: "testuser1",
    password: "password123",
    email: "test@example.com",
    name: "Test User",
  };

  // Cleanup after each test to keep DB consistent
  afterEach(async () => {
    await User.deleteMany({ username: userData.username });
  });

  test("GET /api/login/test returns 'hello world'", async () => {
    const res = await request(server.server).get("/api/login/test").set("x-api-key", process.env.API_KEY);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("hello world");
  });

  test("POST /api/register should successfully create a new user", async () => {
    const registerRes = await request(server.server)
      .post("/api/register")
      .set("x-api-key", process.env.API_KEY)
      .send(userData);

    expect(registerRes.statusCode).toBe(200);
    expect(registerRes.body).toHaveProperty(
      "message",
      "User successfully created"
    );

    const userInDb = await User.findOne({ username: userData.username });
    expect(userInDb).toBeTruthy();
  });

  test("POST /api/login should successfully authenticate with valid credentials", async () => {
    // Register user first
    await request(server.server).post("/api/register").set("x-api-key", process.env.API_KEY).send(userData);

    // Then login
    const res = await request(server.server)
      .post("/api/login")
      .set("x-api-key", process.env.API_KEY)
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

  test("POST /api/login should fail with invalid password", async () => {
    // Register user first
    await request(server.server).post("/api/register").set("x-api-key", process.env.API_KEY).send(userData);

    // Try to login with wrong password
    const res = await request(server.server)
      .post("/api/login")
      .set("x-api-key", process.env.API_KEY)
      .send({
        identity: userData.username,
        password: "wrongpassword",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid|wrong|password/i);
  });

  test("POST /api/login should fail with nonexistent user", async () => {
    const res = await request(server.server)
      .post("/api/login")
      .set("x-api-key", process.env.API_KEY)
      .send({
        identity: "nonexistentuser",
        password: "password123",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not found|invalid|wrong/i);
  });
});
