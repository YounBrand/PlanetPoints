import dotenv from "dotenv";
dotenv.config(); 

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

export type QuizResponse = {
  questions?: QuizQuestion[];
  rawText?: any;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "meta-llama/llama-3.3-70b-instruct:free"

export const generateQuiz = async (topic: string): Promise<QuizResponse> => {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [
        {
          role: "user",
          content: `Generate 3 multiple-choice quiz questions about ${topic}.
                   Format the response strictly as JSON:
                   {"questions":[{"question":"...","options":["A","B","C","D"],"answer":"..."}]}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API call failed with status ${response.status}: ${errorBody.substring(0, 100)}...`);
  }

  const raw = await response.text();

  let contentJson: any;
  try {
    // Parse and extract content
    contentJson = JSON.parse(raw);
  } catch {
    // If response itself isn't valid JSON
    return { rawText: raw }; 
  }

  // Navigate the response structure to get the JSON string
  const content = contentJson?.choices?.[0]?.message?.content; 

  if (!content) {
    return { rawText: contentJson };
  }

const cleanedContent = content.trim()
  .replace(/^```json\s*/, '') // Remove starting ```json and any leading whitespace
  .replace(/\s*```$/, '');    // Remove ending ``` and any trailing whitespace

try {
  return JSON.parse(cleanedContent); 
} catch {
  return { rawText: cleanedContent };
}
};