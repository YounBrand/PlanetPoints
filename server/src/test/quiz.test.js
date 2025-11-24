import dotenv from "dotenv";
import { describe, test, expect, beforeEach, vi } from "vitest";
import server from "../server.js"; 
import * as quizUtil from "../util/quizUtil.js"; 
import * as crypto from 'crypto';
import axios from 'axios';

dotenv.config();

// Generating deterministic hash for comparison
const generateHash = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

const mockOpenRouterAxiosResponse = (llmContent, status = 200) => {
  const apiBody = {
    choices: [{
      message: {
        content: llmContent,
      },
    }],
    id: "chatcmpl-mock", 
    model: "mock-model",
  };
  
  return Promise.resolve({
    data: apiBody,
    status: status,
        statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
        headers: {},
        config: {},
  });
};

const mockOpenRouterAxiosError = (errorData, status = 500) => {
    const error = new Error("Request failed with status code " + status);
    Object.assign(error, {
        response: {
            status: status,
            data: errorData,
            headers: {},
            config: {},
        }
    });
    return Promise.reject(error);
};

describe("quizRoutes.ts", () => {
  beforeEach(() => {
    // Restores mocks between tests
    vi.restoreAllMocks();
    
    vi.spyOn(axios, 'post').mockClear();
  });

  test("should generate quiz successfully", async () => {
    const mockQuizId = "abc1234567890def";
    vi.spyOn(quizUtil, "generateQuiz").mockResolvedValue({
      quizId: mockQuizId,
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
    const body = res.json();
    expect(body.quiz).toHaveProperty("quizId", mockQuizId);
    expect(body.quiz.questions).toHaveLength(1);
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

  test("should return error if quiz generation fails", async () => {
    vi.spyOn(quizUtil, "generateQuiz").mockRejectedValue(new Error("API error"));

    const res = await server.inject({
      method: "POST",
      url: "/api/quiz",
      payload: { topic: "energy" },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe("API error");
  });
  
  // Define the expected content for hashing tests
  const sampleQuizContent = {
    "questions": [
      { "question": "Q1", "options": ["A"], "answer": "A" }
    ]
  };
  const sampleLLMContent = `\`\`\`json\n${JSON.stringify(sampleQuizContent)}\n\`\`\``;
  const expectedHash = generateHash(JSON.stringify(sampleQuizContent));
  
  test("should generate a unique quizId from the content", async () => {
    vi.spyOn(axios, 'post').mockResolvedValue(mockOpenRouterAxiosResponse(sampleLLMContent));

    const quizResult = await quizUtil.generateQuiz("climate");
    
    expect(quizResult).toHaveProperty("quizId"); 
    expect(typeof quizResult.quizId).toBe("string");
    expect(quizResult.quizId).toBe(expectedHash);
    expect(quizResult).toHaveProperty("questions");
    expect(quizResult).not.toHaveProperty("rawText");
  });

  test("should return rawText if LLM output is not valid JSON", async () => {
    const rawContent = "This is not JSON, it's just raw text.";
    
    vi.spyOn(axios, 'post').mockResolvedValue(mockOpenRouterAxiosResponse(rawContent));

    const quizResult = await quizUtil.generateQuiz("history");

    expect(quizResult).toHaveProperty("rawText");
    expect(quizResult.rawText).toBe(rawContent);
    expect(quizResult).not.toHaveProperty("questions");
    expect(quizResult).not.toHaveProperty("quizId");
  });

  test("should return rawText if OpenRouter response cannot be parsed", async () => {
    const rawContent = "This is not JSON content in the message field.";
    
    vi.spyOn(axios, 'post').mockResolvedValue(mockOpenRouterAxiosResponse(rawContent));

    const quizResult = await quizUtil.generateQuiz("recycling");

    expect(quizResult).toHaveProperty("rawText");
    expect(quizResult.rawText).toBe(rawContent);
    expect(quizResult).not.toHaveProperty("questions");
    expect(quizResult).not.toHaveProperty("quizId"); 
  });
    
    test("should handle API failure", async () => {
        const errorDetails = { error: { message: "Invalid API key" } };
        
        vi.spyOn(axios, 'post').mockImplementation(() => mockOpenRouterAxiosError(errorDetails, 401));

        await expect(quizUtil.generateQuiz("fail")).rejects.toThrow(/OpenRouter API call failed \(Status 401\)/);
    });

  test("should generate a quiz question and validate its format", async () => {  
    const topic = "climate change";
    let quizResult;

    vi.spyOn(axios, 'post').mockRestore(); 

    try {
      quizResult = await quizUtil.generateQuiz(topic);
    } catch (error) {
      throw new Error(`API call failed during test. 
      Ensure OPENROUTER_API_KEY is set and valid. Original error: ${error.message}`);
    }

    // Check for successful parsing and content
    expect(quizResult).not.toHaveProperty("rawText");
    
    // Validate quizId property
    expect(quizResult).toHaveProperty("quizId");
    expect(typeof quizResult.quizId).toBe("string");
    expect(quizResult.quizId.length).toBe(64);

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
    
  }, 100000);
});