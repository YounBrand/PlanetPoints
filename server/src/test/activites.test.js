import dotenv from "dotenv";
dotenv.config();

import { describe, test, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import server from "../server.js";
import connectDB from "../modules/db.js";
import { User } from "../schemas/User.js";
import * as activitiesUtil from "../util/dailyActivitiesUtil.js";
import { ActivityType } from "../util/dailyActivitiesUtil.js";

// Ensure DB is connected before tests
await connectDB();

describe("activitiesRoutes.ts", () => {
  let testUser;
  const apiKey = process.env.API_KEY;

  beforeEach(() => {
    // Reset mocks before each test
    vi.restoreAllMocks();
  });

  beforeAll(async () => {
    // Create a test user before running tests
    testUser = await User.create({
      username: "testuser_activities",
      password: "password123",
      email: "test_activities@example.com",
      name: "Test User",
      activities: [],
    });
  });

  afterAll(async () => {
    // Cleanup test user after tests
    await User.deleteMany({ username: "testuser_activities" });
  });

  // -----------------------------
  // POST /api/activities/log-daily
  // -----------------------------

  test("should reject missing user", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/activities/log-daily",
      payload: { userId: "64afafafafafafafafafafaf", activity: ActivityType.MilesTravelled, unit: 5 },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().message).toBe("User not found");
  });

  test("should reject invalid activity type", async () => {
    vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(false);

    const res = await server.inject({
      method: "POST",
      url: "/api/activities/log-daily",
      payload: { userId: testUser._id, activity: "invalid type", unit: 10 },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toBe("Invalid activity type");
  });

  test("should log successfully", async () => {
    vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(true);
    vi.spyOn(activitiesUtil, "logActivity").mockResolvedValue({
      success: true,
      message: "Logged activity for user",
    });

    const res = await server.inject({
      method: "POST",
      url: "/api/activities/log-daily",
      payload: { userId: testUser._id, activity: ActivityType.MilesTravelled, unit: 5 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBe("Activity logged successfully");
  });

  test("should reject missing unit", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/activities/log-daily",
      payload: { userId: testUser._id, activity: ActivityType.MilesTravelled },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toBe("You must specify the units");
  });

  // -----------------------------
  // GET /api/activities/get
  // -----------------------------
  test("should reject missing userId", async () => {
    const res = await server.inject({
      method: "GET",
      url: "/api/activities/get",
      query: { activity: ActivityType.MilesTravelled },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toBe("You must provide a userId");
  });

  test("should reject invalid activity type", async () => {
    vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(false);

    const res = await server.inject({
      method: "GET",
      url: "/api/activities/get",
      query: { userId: String(testUser._id), activity: "invalid type" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toBe("Invalid activity type");
  });

  test("should return results successfully", async () => {
    vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(true);
    vi.spyOn(activitiesUtil, "getActivities").mockResolvedValue({
      success: true,
      data: [{ activity: ActivityType.MilesTravelled, unit: 10 }],
    });

    const res = await server.inject({
      method: "GET",
      url: "/api/activities/get",
      query: {
        userId: String(testUser._id),
        activity: ActivityType.MilesTravelled,
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toBeInstanceOf(Array);
    expect(res.json().data[0].activity).toBe(ActivityType.MilesTravelled);
  });

  test("should apply unit filters correctly", async () => {
    vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(true);

    const mockGetActivities = vi.spyOn(activitiesUtil, "getActivities").mockResolvedValue({
      success: true,
      data: [
        { activity: ActivityType.MilesTravelled, unit: 12 },
        { activity: ActivityType.MilesTravelled, unit: 15 },
      ],
    });

    const res = await server.inject({
      method: "GET",
      url: "/api/activities/get",
      query: {
        userId: String(testUser._id),
        activity: ActivityType.MilesTravelled,
        unitFrom: "10",
        unitTo: "20",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(2);
    expect(mockGetActivities).toHaveBeenCalledWith(
      String(testUser._id),
      ActivityType.MilesTravelled,
      expect.objectContaining({ unitFrom: 10, unitTo: 20 })
    );
  });

  test("should return empty array when no results", async () => {
    vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(true);
    vi.spyOn(activitiesUtil, "getActivities").mockResolvedValue({ success: true, data: [] });

    const res = await server.inject({
      method: "GET",
      url: "/api/activities/get",
      query: { userId: String(testUser._id), activity: ActivityType.MilesTravelled },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual([]);
  });
    // -----------------------------
  // GET /api/activities/calculate-score
  // -----------------------------
  test("should reject missing parameters for calculate-score", async () => {
    const res = await server.inject({
      method: "GET",
      url: "/api/activities/calculate-score",
      query: { userId: String(testUser._id), dateFrom: "2025-01-01" }, // missing dateTo
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toBe("userId, dateFrom and dateTo are required");
  });

  test("should return error if getScore fails", async () => {
    vi.spyOn(activitiesUtil, "getScore").mockResolvedValue({
      success: false,
      message: "Score calculation failed",
    });

    const res = await server.inject({
      method: "GET",
      url: "/api/activities/calculate-score",
      query: {
        userId: String(testUser._id),
        dateFrom: "2025-01-01",
        dateTo: "2025-02-01",
      },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json().message).toBe("Score calculation failed");
  });

  test("should calculate score successfully", async () => {
    vi.spyOn(activitiesUtil, "getScore").mockResolvedValue({
      success: true,
      score: 42,
    });

    const res = await server.inject({
      method: "GET",
      url: "/api/activities/calculate-score",
      query: {
        userId: String(testUser._id),
        dateFrom: "2025-01-01",
        dateTo: "2025-02-01",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toBe(42);
  });

  // -----------------------------
  // GET /api/activities/get-leaderboard
  // -----------------------------
  test("should reject missing date To range for leaderboard", async () => {
    const res = await server.inject({
      method: "GET",
      url: "/api/activities/get-leaderboard",
      query: { dateFrom: "2025-01-01" }, 
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toBe("dateFrom and dateTo are required");
  });

    test("should reject missing date From range for leaderboard", async () => {
    const res = await server.inject({
      method: "GET",
      url: "/api/activities/get-leaderboard",
      query: { dateTo: "2025-01-01" }, 
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toBe("dateFrom and dateTo are required");
  });

  test("should return error if leaderboard calculation fails", async () => {
    vi.spyOn(activitiesUtil, "getLeaderboard").mockResolvedValue({
      success: false,
      message: "Leaderboard error",
    });

    const res = await server.inject({
      method: "GET",
      url: "/api/activities/get-leaderboard",
      query: {
        dateFrom: "2025-01-01",
        dateTo: "2025-02-01",
      },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json().message).toBe("Leaderboard error");
  });

  test("should return leaderboard successfully", async () => {
    vi.spyOn(activitiesUtil, "getLeaderboard").mockResolvedValue({
      success: true,
      data: [
        { username: "A", score: 100, rank: 1 },
        { username: "B", score: 80, rank: 2 },
      ],
    });

    const res = await server.inject({
      method: "GET",
      url: "/api/activities/get-leaderboard",
      query: {
        dateFrom: "2025-01-01",
        dateTo: "2025-02-01",
      },
    });

    expect(res.statusCode).toBe(200);
    const leaderboard = res.json();

    expect(leaderboard).toBeInstanceOf(Array);
    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0].username).toBe("A");
    expect(leaderboard[0].rank).toBe(1);
  });

    test("should rank tied scores sequentially", async () => {
    vi.spyOn(activitiesUtil, "getLeaderboard").mockResolvedValue({
      success: true,
      data: [
        { username: "UserA", score: 50, rank: 1 },
        { username: "UserB", score: 50, rank: 2 }, 
        { username: "UserC", score: 30, rank: 3 },
      ],
    });

    const res = await server.inject({
      method: "GET",
      url: "/api/activities/get-leaderboard",
      query: {
        dateFrom: "2025-01-01",
        dateTo: "2025-02-01",
      },
    });

    expect(res.statusCode).toBe(200);

    const leaderboard = res.json();

    expect(leaderboard).toHaveLength(3);

    expect(leaderboard[0].username).toBe("UserA");
    expect(leaderboard[0].score).toBe(50);
    expect(leaderboard[0].rank).toBe(1);

    expect(leaderboard[1].username).toBe("UserB");
    expect(leaderboard[1].score).toBe(50);
    expect(leaderboard[1].rank).toBe(2); 

    expect(leaderboard[2].username).toBe("UserC");
    expect(leaderboard[2].rank).toBe(3);
  });
});
