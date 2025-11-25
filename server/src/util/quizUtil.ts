import axios from "axios";
import * as crypto from 'crypto';
import dotenv from "dotenv";
dotenv.config(); 

export const generateQuiz = async (topic: string): Promise<QuizResponse> => {
    if (!process.env.OPENROUTER_API_KEY) {
        return { success: false, message: "OPENROUTER_API_KEY environment variable is not set." };
    }
    if (!process.env.OPENROUTER_URL) {
        return { success: false, message: "OPENROUTER_URL environment variable is not set." };
    }
    const payload = {
        model: "x-ai/grok-4.1-fast:free",
        messages: [
            {
                role: "user",
                content: `Generate 3 multiple-choice quiz questions about ${topic}.
                          Format the response strictly as JSON:
                          {"questions":[{"question":"...","options":["A","B","C","D"],"answer":"..."}]}`,
            },
        ],
    };
    try {
        const response = await axios.post(
            `${process.env.OPENROUTER_URL}`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );
        // Extract content
        const content = (response.data as OpenRouterAPIData)
            ?.choices?.[0]?.message?.content;
        if (!content) {
            return { success: false, message: "API response received but contained no content." };
        }
        const quizObject = extractQuizObject(content);
        if (!quizObject) {
            return { success: false, message: "Failed to parse quiz JSON from LLM response." };
        }
        const quizId = crypto.randomUUID();
        return {
            success: true,
            data: {
                quizId: quizId,
                questions: quizObject.questions
            }
        };
    } catch (err: unknown) {
    const errorWithResponse = err as { response?: { status: number; data: any; message?: string } };
    if (errorWithResponse.response) {
      const status = errorWithResponse.response.status;
      const errorData = JSON.stringify(errorWithResponse.response.data);
      return { 
        success: false, 
        message: `OpenRouter API call failed (Status ${status}): ${errorData.substring(0, 100)}...` 
      };
    }
    const errorMessage = (err instanceof Error) ? err.message : 'An unknown network error occurred.';
    return { 
      success: false, 
      message: `Network or Request Setup Error: ${errorMessage}` 
    };
  }
};

// Parses quiz object from response string
const extractQuizObject = (content: string): { questions: QuizQuestion[] } | null => {
    const cleanedContent = content.trim()
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '');
    try {
        return JSON.parse(cleanedContent) as { questions: QuizQuestion[] };
    } catch {
        return null; 
    }
};

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
};

export type QuizResponse =
  | { success: true; data: { quizId: string; questions: QuizQuestion[] } }
  | { success: false; message: string };

export type OpenRouterAPIData = {
    choices: Array<{
        message: {
            content: string;
        }
    }>;
};