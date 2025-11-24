import dotenv from "dotenv";
import { describe, test, expect, beforeEach, vi } from "vitest";
import server from "../server.js"; 
import * as quizUtil from "../util/quizUtil.js"; 

dotenv.config();
const originalFetch = global.fetch;

const mockOpenRouterResponse = (llmContent, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status: status,
    // Mock the OpenRouter API structure containing the LLM's response
    json: () => Promise.resolve({
      choices: [{
        message: {
          content: llmContent,
        },
      }],
    }),
    text: () => Promise.resolve(JSON.stringify({
        choices: [{
          message: {
            content: llmContent,
          },
        }],
      })),
  });
};

describe("quizRoutes.ts", () => {
  beforeEach(() => {
    // Restores mocks between tests
    vi.restoreAllMocks();
    global.fetch = originalFetch; 
  });
  
  test("should generate quiz successfully", async () => {
    vi.spyOn(quizUtil, "generateQuiz").mockResolvedValue({
      questions: [
        {
          question: "What is carbon footprint?",
          options: ["A", "B", "C", "D"],
          answer: "A",
        },
      ],
    });

    const res = await server.inject({
      method: "POST",
      url: "/api/quiz",
      payload: { topic: "carbon footprint" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().quiz.questions).toHaveLength(1);
  });

  test("should default topic when not provided", async () => {
    const mock = vi.spyOn(quizUtil, "generateQuiz").mockResolvedValue({
      questions: [],
    });

    await server.inject({
      method: "POST",
      url: "/api/quiz",
      payload: {},
    });

    expect(mock).toHaveBeenCalledWith("carbon footprint");
  });

  test("should return 500 if quiz generation fails", async () => {
    vi.spyOn(quizUtil, "generateQuiz").mockRejectedValue(new Error("API error"));

    const res = await server.inject({
      method: "POST",
      url: "/api/quiz",
      payload: { topic: "energy" },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe("API error");
  });

  test("should return rawText if LLM output is not valid JSON", async () => {
    const rawContent = "This is not JSON, it's just raw text.";
    
    vi.spyOn(global, 'fetch').mockResolvedValue(mockOpenRouterResponse(rawContent));

    const quizResult = await quizUtil.generateQuiz("history");

    expect(quizResult).toHaveProperty("rawText");
    expect(quizResult.rawText).toBe(rawContent);
    expect(quizResult).not.toHaveProperty("questions");
  });

  test("should return rawText if OpenRouter response cannot be parsed", async () => {
    const rawAPIResponse = "Server maintenance, please try again.";
    
    vi.spyOn(global, 'fetch').mockResolvedValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => { throw new Error('Simulated JSON parse error'); }, 
      text: () => Promise.resolve(rawAPIResponse), 
    }));

    const quizResult = await quizUtil.generateQuiz("history");

    expect(quizResult).toHaveProperty("rawText");
    expect(quizResult.rawText).toBe(rawAPIResponse);
    expect(quizResult).not.toHaveProperty("questions");
  });

  test("should generate a quiz question and validate its format (Real API Call)", async () => {    
    const topic = "energy";
    let quizResult;

    try {      
      quizResult = await quizUtil.generateQuiz(topic);
    } catch (error) {
      throw new Error(`API call failed during test. 
        Ensure your OPENROUTER_API_KEY is set and valid. Original error: ${error.message}`);
    }

    // Check for successful parsing and content
    expect(quizResult).not.toHaveProperty("rawText");
    expect(quizResult).toHaveProperty("questions");
    expect(quizResult.questions).toBeInstanceOf(Array);
    expect(quizResult.questions.length).toBeGreaterThan(0); 

    const firstQuestion = quizResult.questions[0];

    // Validate the essential question fields
    expect(firstQuestion).toHaveProperty("question");
    expect(typeof firstQuestion.question).toBe("string");
    expect(firstQuestion).toHaveProperty("options");
    expect(firstQuestion.options).toBeInstanceOf(Array);
    expect(firstQuestion).toHaveProperty("answer");
    expect(typeof firstQuestion.answer).toBe("string");
    
  }, 20000);
});