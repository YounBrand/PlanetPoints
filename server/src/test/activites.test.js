import dotenv from "dotenv";
dotenv.config();

import { describe, test, expect, beforeEach, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";
import server from "../server.js";
import connectDB from "../modules/db.js";
import { User } from "../schemas/User.js";
import * as activitiesUtil from "../util/dailyActivitiesUtil.js";
import * as authUtil from "../util/authUtil.js";
import { ActivityType } from "../util/dailyActivitiesUtil.js";

// Ensure DB is connected before tests
await connectDB();

describe("activitiesRoutes.ts", () => {
  let testUser;
  const apiKey = process.env.API_KEY;

    beforeEach(() => {
        // Reset mocks before each test
        vi.restoreAllMocks();
        // Ensure API key verification works as expected
        vi.spyOn(authUtil, "verifyApiKey").mockImplementation((key) => key === apiKey);
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

    
    // Test POST /api/activities/log-daily
    // -----------------------------------
    // Test reject missing API key
    test("POST /api/activities/log-daily → should reject missing API key", async () => {
        const res = await request(server.server)
        .post("/api/activities/log-daily")
        .send({ userId: testUser._id, activity: ActivityType.MilesTravelled, unit: 10 });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Forbidden");
    });

    // Test reject missing user
    test("POST /api/activities/log-daily → should reject missing user", async () => {
        const res = await request(server.server)
        .post("/api/activities/log-daily")
        .set("x-api-key", apiKey)
        .send({ userId: "64afafafafafafafafafafaf", activity: ActivityType.MilesTravelled, unit: 5 });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("User not found");
    });

    // Test reject invalid activity type
    test("POST /api/activities/log-daily → should reject invalid activity type", async () => {
        vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(false);

        const res = await request(server.server)
        .post("/api/activities/log-daily")
        .set("x-api-key", apiKey)
        .send({ userId: testUser._id, activity: "invalid type", unit: 10 });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Invalid activity type");
    });

    // Test successful logging
    test("POST /api/activities/log-daily → should log successfully", async () => {
        vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(true);
        vi.spyOn(activitiesUtil, "logActivity").mockResolvedValue({
        success: true,
        message: "Logged activity for user",
        });

        const res = await request(server.server)
        .post("/api/activities/log-daily")
        .set("x-api-key", apiKey)
        .send({
            userId: testUser._id,
            activity: ActivityType.MilesTravelled,
            unit: 5,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Activity logged successfully");
    });
    // Test missing unit
    test("POST /api/activities/log-daily → should reject missing unit", async () => {
        const res = await request(server.server)
        .post("/api/activities/log-daily")
        .set("x-api-key", apiKey)
        .send({
            userId: String(testUser._id),
            activity: ActivityType.MilesTravelled,
            // unit is missing
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("You must specify the units");
    });

    // Test GET /api/activities/get
    //-----------------------------
    // Test reject missing API key
    test("GET /api/activities/get → should reject missing userId", async () => {
    const res = await request(server.server)
        .get("/api/activities/get")
        .set("x-api-key", apiKey)
        .query({ activity: ActivityType.MilesTravelled });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("You must provide a userId");
    });

    // Test reject missing activity type
    test("GET /api/activities/get → should reject invalid activity type", async () => {
        vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(false);

        const res = await request(server.server)
        .get("/api/activities/get")
        .set("x-api-key", apiKey)
        .query({ userId: String(testUser._id), activity: "invalid type" });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Invalid activity type");
    });

    // Test successful retrieval
    test("GET /api/activities/get → should return results successfully", async () => {
        vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(true);
        vi.spyOn(activitiesUtil, "getActivities").mockResolvedValue({
            success: true,
            data: [{ activity: ActivityType.MilesTravelled, unit: 10 }],
        });

        const res = await request(server.server)
            .get("/api/activities/get")
            .set("x-api-key", apiKey)
            .query({
            userId: String(testUser._id),
            activity: ActivityType.MilesTravelled,
            dateFrom: "2025-01-01",
            dateTo: "2025-12-31",
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data[0].activity).toBe(ActivityType.MilesTravelled);
    });

    // Test unit filters
    test("GET /api/activities/get → should apply unit filters correctly", async () => {
        vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(true);

        const mockGetActivities = vi
        .spyOn(activitiesUtil, "getActivities")
        .mockResolvedValue({
            success: true,
            data: [
            { activity: ActivityType.MilesTravelled, unit: 12 },
            { activity: ActivityType.MilesTravelled, unit: 15 },
            ],
        });

        const res = await request(server.server)
        .get("/api/activities/get")
        .set("x-api-key", apiKey)
        .query({
            userId: String(testUser._id),
            activity: ActivityType.MilesTravelled,
            unitFrom: "10",
            unitTo: "20",
        });

        // Assert the request was successful
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(2);

        // Assert Fastify passed correct params to getActivities
        expect(mockGetActivities).toHaveBeenCalledWith(
        String(testUser._id),
        ActivityType.MilesTravelled,
        expect.objectContaining({
            unitFrom: 10,
            unitTo: 20,
        })
        );
    });

    // Empty results test
    test("GET /api/activities/get → should return empty array when no results", async () => {
        vi.spyOn(activitiesUtil, "isActivityType").mockReturnValue(true);
        vi.spyOn(activitiesUtil, "getActivities").mockResolvedValue({
        success: true,
        data: [],
        });

        const res = await request(server.server)
        .get("/api/activities/get")
        .set("x-api-key", apiKey)
        .query({
            userId: String(testUser._id),
            activity: ActivityType.MilesTravelled,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    // Invalid API key
    test("GET /api/activities/get → should reject invalid API key", async () => {
        const res = await request(server.server)
        .get("/api/activities/get")
        .set("x-api-key", "WRONG_KEY")
        .query({
            userId: String(testUser._id),
            activity: ActivityType.MilesTravelled,
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Forbidden");
    });
});