import dotenv from "dotenv";
import { describe, test, expect, beforeEach, vi } from "vitest";
import server from "../server"; 
import * as quizUtil from "../util/quizUtil"; 
import axios from 'axios';

dotenv.config();

// Used to mock the format of quizId
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mockOpenRouterAxiosResponse = (llmContent, status = 200) => {
  const apiBody = {
    choices: [{
      message: { content: llmContent },
    }],
  };
  
  return Promise.resolve({
    data: apiBody,
    status: status,
    statusText: 'OK',
    headers: {},
    config: {},
  });
};

const mockOpenRouterAxiosError = (errorData, status = 500) => {
    const error = new Error("Request failed");
    Object.assign(error, {
        response: {
            status: status,
            data: errorData,
        }
    });
    return Promise.reject(error);
};

describe("quizRoutes.ts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(axios, 'post').mockClear();
  });

  test("should generate quiz successfully", async () => {
    const mockQuizId = "123e4567-e89b-12d3-a456-426614174000";
    
    vi.spyOn(quizUtil, "generateQuiz").mockResolvedValue({
      success: true,
      data: {
        quizId: mockQuizId,
        questions: [
          {
            question: "What is carbon footprint?",
            options: ["A", "B", "C", "D"],
            answer: "A",
          },
        ],
      }
    });

    const res = await server.inject({
      method: "POST",
      url: "/api/quiz",
      payload: { topic: "carbon footprint" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    
    expect(body.quiz).toHaveProperty("quizId", mockQuizId);
    expect(body.quiz.questions).toHaveLength(1);
  });

  test("should default topic when not provided", async () => {
    const mock = vi.spyOn(quizUtil, "generateQuiz").mockResolvedValue({
      success: true,
      data: { quizId: "uuid", questions: [] }
    });

    await server.inject({
      method: "POST",
      url: "/api/quiz",
      payload: {},
    });

    expect(mock).toHaveBeenCalledWith("carbon footprint");
  });

  test("should return error if quiz generation fails", async () => {
    vi.spyOn(quizUtil, "generateQuiz").mockResolvedValue({
        success: false,
        message: "API error"
    });

    const res = await server.inject({
      method: "POST",
      url: "/api/quiz",
      payload: { topic: "energy" },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe("API error");
  });

  const sampleQuizContent = {
    "questions": [
      { "question": "Q1", "options": ["A"], "answer": "A" }
    ]
  };
  const sampleLLMContent = `\`\`\`json\n${JSON.stringify(sampleQuizContent)}\n\`\`\``;
  
  test("should generate a valid UUID quizId from content", async () => {
    vi.spyOn(axios, 'post').mockResolvedValue(mockOpenRouterAxiosResponse(sampleLLMContent));

    const quizResult = await quizUtil.generateQuiz("climate");
    
    expect(quizResult.success).toBe(true);
    
    if (quizResult.success) {
        expect(quizResult.data).toHaveProperty("quizId");
        expect(quizResult.data.quizId).toMatch(uuidRegex);
        expect(quizResult.data.questions).toHaveLength(1);
    }
  });

  test("should return error if LLM output is not valid JSON", async () => {
    const rawContent = "This is not JSON, it's just raw text.";
    
    vi.spyOn(axios, 'post').mockResolvedValue(mockOpenRouterAxiosResponse(rawContent));

    const quizResult = await quizUtil.generateQuiz("history");

    expect(quizResult.success).toBe(false);
    if (!quizResult.success) {
        expect(quizResult.message).toContain("Failed to parse quiz JSON");
    }
  });

  test("should return error if API response has no content", async () => {
    const emptyContent = ""; 
    vi.spyOn(axios, 'post').mockResolvedValue(mockOpenRouterAxiosResponse(emptyContent));

    const quizResult = await quizUtil.generateQuiz("recycling");

    expect(quizResult.success).toBe(false);
    if (!quizResult.success) {
        expect(quizResult.message).toContain("no content");
    }
  });
    
  test("should return error on API failure", async () => {
      const errorDetails = { error: { message: "Invalid API key" } };
      
      vi.spyOn(axios, 'post').mockImplementation(() => mockOpenRouterAxiosError(errorDetails, 401));

      const result = await quizUtil.generateQuiz("fail");

      expect(result.success).toBe(false);
      if (!result.success) {
          expect(result.message).toContain("Status 401");
      }
  });

  test("should generate a quiz question and validate format (Real API Call)", async () => {  
    const topic = "climate change";
    let quizResult;

    vi.spyOn(axios, 'post').mockRestore(); 

    try {
      quizResult = await quizUtil.generateQuiz(topic);
    } catch (error) {
      throw new Error(`Unexpected error: ${error.message}`);
    }

    if (!quizResult.success) {
        throw new Error(`API call returned failure: ${quizResult.message}`);
    }

    expect(quizResult.success).toBe(true);

    if (quizResult.success) {
        const data = quizResult.data;
        expect(data).toHaveProperty("quizId");
        expect(data.quizId).toMatch(uuidRegex);

        expect(data).toHaveProperty("questions");
        expect(data.questions).toBeInstanceOf(Array);
        expect(data.questions.length).toBeGreaterThan(0); 

        const firstQuestion = data.questions[0];

        expect(firstQuestion).toHaveProperty("question");
        expect(typeof firstQuestion.question).toBe("string");
        expect(firstQuestion).toHaveProperty("options");
        expect(firstQuestion.options).toBeInstanceOf(Array);
        expect(firstQuestion).toHaveProperty("answer");
        expect(typeof firstQuestion.answer).toBe("string");
    }
  }, 100000);
});