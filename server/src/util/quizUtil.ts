import axios from "axios";
import * as crypto from 'crypto';
import dotenv from "dotenv";
dotenv.config(); 

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

export type QuizResponse = {
  quizId?: string;
  questions?: QuizQuestion[];
  rawText?: any;
};

export type OpenRouterAPIData = {
    choices: Array<{
        message: {
            content: string;
        }
    }>;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "x-ai/grok-4.1-fast:free"

// Generate unique hash string for quizId
const generateHash = (content: string): string => {
    return crypto.createHash('sha256').update(content).digest('hex');
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

export const generateQuiz = async (topic: string): Promise<QuizResponse> => {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY environment variable is not set.");
    }
    const payload = {
        model: MODEL_ID,
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
            OPENROUTER_URL,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        const content = (response.data as OpenRouterAPIData)
            ?.choices?.[0]?.message?.content;

        if (!content) {
            // Return raw data if content is missing (e.g., API structure changed)
            return { rawText: response.data };
        }
        
        const quizObject = extractQuizObject(content);

        if (!quizObject) {
            // Failed to parse the cleaned content into the quiz format
            return { rawText: content };
        }
        
        // Generate the unique ID based on content
        const normalizedContent = JSON.stringify(quizObject);
        const quizId = generateHash(normalizedContent);

        return {
            quizId: quizId,
            questions: quizObject.questions
        };

    } catch (err: unknown) {
        const errorWithResponse = err as { response?: { status: number; data: any; message?: string } };
        if (errorWithResponse.response) {
            const status = errorWithResponse.response.status;
            const errorData = JSON.stringify(errorWithResponse.response.data);
            throw new Error(`OpenRouter API call failed (Status ${status}): ${errorData.substring(0, 150)}...`);
        }

        const errorMessage = (err instanceof Error) ? err.message : 'An unknown network error occurred.';
        throw new Error(`Network or Request Setup Error: ${errorMessage}`);
    }
};