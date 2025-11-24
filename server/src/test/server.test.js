import dotenv from "dotenv";
dotenv.config();

import { describe, test, expect, afterEach } from "vitest";
import server from "../server.js";
import connectDB from "../modules/db.js";
import { User } from "../schemas/User.js";

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

  // -----------------------------
  // GET /api/login/test
  // -----------------------------

  test("GET /api/health returns 'Backend is healthy!'", async () => {
    const res = await server.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBe("Backend is healthy!");
  });

  // -----------------------------
  // POST /api/register
  // -----------------------------

  test("should successfully create a new user", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/register",
      payload: userData,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("message", "User successfully created");

    const userInDb = await User.findOne({ username: userData.username });
    expect(userInDb).toBeTruthy();
  });

  // -----------------------------
  // POST /api/login (valid)
  // -----------------------------

  test("should authenticate with valid credentials", async () => {
    // Register user first
    await server.inject({
      method: "POST",
      url: "/api/register",
      payload: userData,
    });

    // Login
    const res = await server.inject({
      method: "POST",
      url: "/api/login",
      payload: { identity: userData.username, password: userData.password },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("message", "Login successful");
    expect(res.json().user).toBeDefined();
  });

  // -----------------------------
  // POST /api/login (invalid password)
  // -----------------------------

  test("should fail with invalid password", async () => {
    // Register user first
    await server.inject({
      method: "POST",
      url: "/api/register",
      payload: userData,
    });

    // Try to login with wrong password
    const res = await server.inject({
      method: "POST",
      url: "/api/login",
      payload: { identity: userData.username, password: "wrongpassword" },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().message).toMatch(/invalid|wrong|password/i);
  });

  // -----------------------------
  // POST /api/login (nonexistent user)
  // -----------------------------

  test("should fail with nonexistent user", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/login",
      payload: { identity: "nonexistentuser", password: "password123" },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().message).toMatch(/not found|invalid|wrong/i);
  });
});
