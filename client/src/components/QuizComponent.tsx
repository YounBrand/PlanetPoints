import { useState } from "react";
import axios from "axios";

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface QuizComponentProps {
  userId: string | null;
  onQuizComplete: () => void;
}

export default function QuizComponent({ userId, onQuizComplete }: QuizComponentProps) {
  const [quizState, setQuizState] = useState<"idle" | "loading" | "active" | "completed">("idle");
  const [quizTopic, setQuizTopic] = useState("carbon footprint");
  const [customTopic, setCustomTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const topicOptions = [
    { value: "carbon footprint", label: "Carbon Footprint" },
    { value: "renewable energy", label: "Renewable Energy" },
    { value: "recycling", label: "Recycling & Waste" },
    { value: "water conservation", label: "Water Conservation" },
    { value: "sustainable transportation", label: "Sustainable Transportation" },
    { value: "biodiversity", label: "Biodiversity" },
    { value: "custom", label: "Custom Topic" },
  ];

  const startQuiz = async () => {
    setError(null);
    setQuizState("loading");
    
    const topic = quizTopic === "custom" ? customTopic : quizTopic;
    
    if (!topic.trim()) {
      setError("Please enter a topic");
      setQuizState("idle");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/quiz`,
        { topic },
        { 
          withCredentials: true,
          headers: {
            "x-api-key": import.meta.env.VITE_API_KEY || "",
          },
        }
      );

      if (response.data.quiz?.questions && response.data.quiz.questions.length > 0) {
        setQuestions(response.data.quiz.questions);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setScore(0);
        setQuizState("active");
      } else {
        setError("Quiz generated but contained no questions");
        setQuizState("idle");
      }
    } catch (err) {
      console.error("Error generating quiz:", err);
      setError("Failed to generate quiz. Please try again.");
      setQuizState("idle");
    }
  };

  const submitAnswer = () => {
    if (!selectedAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    
    // Check if the answer matches either the full text or just the letter prefix
    const normalizedSelected = selectedAnswer.trim();
    const normalizedCorrect = currentQuestion.answer.trim();
    
    // Try matching full text, or just the letter at the start (A, B, C, D)
    const selectedLetter = normalizedSelected.charAt(0).toUpperCase();
    const correctLetter = normalizedCorrect.charAt(0).toUpperCase();
    
    const isCorrect = 
      normalizedSelected === normalizedCorrect || // Full match
      normalizedSelected.startsWith(normalizedCorrect) || // Selected starts with correct
      normalizedCorrect.startsWith(normalizedSelected) || // Correct starts with selected
      selectedLetter === correctLetter; // Letter match
    
    setUserAnswers([...userAnswers, selectedAnswer]);
    
    if (isCorrect) {
      setScore(score + 1);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      const finalScore = isCorrect ? score + 1 : score;
      setScore(finalScore);
      completeQuiz(finalScore);
    }
  };

  const completeQuiz = async (finalScore: number) => {
    setQuizState("completed");
    
    const pointsEarned = finalScore * 10;
    
    if (userId && pointsEarned > 0) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/activities/log-daily`,
          {
            userId,
            activity: "QuizCompleted",
            unit: pointsEarned,
          },
          {
            withCredentials: true,
            headers: {
              "x-api-key": import.meta.env.VITE_API_KEY || "",
            },
          }
        );
        onQuizComplete();
      } catch (err) {
        console.error("Error logging quiz points:", err);
      }
    }
  };

  const resetQuiz = () => {
    setQuizState("idle");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
    setScore(0);
    setError(null);
  };

  // IDLE STATE
  if (quizState === "idle") {
    return (
      <div>
        <p className="pp-muted">
          Test your sustainability knowledge and earn points! Each correct answer earns you 10 points.
        </p>
        
        <div className="pp-card">
          <h3>Choose a Quiz Topic</h3>
          
          <div className="pp-modal-field">
            <label className="pp-modal-label">Topic:</label>
            <select
              value={quizTopic}
              onChange={(e) => setQuizTopic(e.target.value)}
              className="pp-modal-input"
            >
              {topicOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {quizTopic === "custom" && (
            <div className="pp-modal-field">
              <label className="pp-modal-label">Custom Topic:</label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Enter your topic..."
                className="pp-modal-input"
              />
            </div>
          )}

          {error && (
            <p className="pp-quiz-review-incorrect">
              {error}
            </p>
          )}

          <button
            className="pp-btn primary"
            onClick={startQuiz}
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (quizState === "loading") {
    return (
      <div className="pp-card pp-quiz-loading">
        <span className="pp-quiz-loading-icon">🤔</span>
        <p>Generating your quiz...</p>
      </div>
    );
  }

  // ACTIVE STATE
  if (quizState === "active" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="pp-card">
        <div className="pp-quiz-progress">
          <div className="pp-quiz-progress-info">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>Score: {score}/{currentQuestionIndex}</span>
          </div>
          <div className="pp-quiz-progress-bar">
            <div className="pp-quiz-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <h3 className="pp-quiz-question">
          {currentQuestion.question}
        </h3>

        <div className="pp-quiz-options">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedAnswer(option)}
              className={`pp-btn pp-quiz-option ${selectedAnswer === option ? "primary" : ""}`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          className="pp-btn primary"
          onClick={submitAnswer}
          disabled={!selectedAnswer}
        >
          {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
        </button>
      </div>
    );
  }

  // COMPLETED STATE
  if (quizState === "completed") {
    const percentage = Math.round((score / questions.length) * 100);
    const pointsEarned = score * 10;

    return (
      <div>
        <div className="pp-card pp-quiz-results">
          <span className="pp-quiz-emoji">
            {percentage >= 80 ? "🎉" : percentage >= 60 ? "👍" : "📚"}
          </span>
          
          <h3>Quiz Complete!</h3>
          
          <p className="pp-quiz-score-display">
            {score} / {questions.length}
          </p>
          
          <p className="pp-muted">
            You scored {percentage}% and earned {pointsEarned} points!
          </p>

          {percentage < 100 && (
            <p className="pp-muted">
              {percentage >= 60 
                ? "Good job! Keep learning to improve your score." 
                : "Keep studying! Every quiz helps you learn more about sustainability."}
            </p>
          )}

          <div className="pp-quiz-actions">
            <button className="pp-btn" onClick={resetQuiz}>
              Take Another Quiz
            </button>
            <button className="pp-btn primary" onClick={resetQuiz}>
              Done
            </button>
          </div>
        </div>

        <div className="pp-card pp-quiz-review">
          <h3>Review Your Answers</h3>
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[idx];
            const correctAnswer = q.answer;
            
            // Normalize comparison
            const userLetter = userAnswer?.charAt(0).toUpperCase();
            const correctLetter = correctAnswer?.charAt(0).toUpperCase();
            
            const isCorrect = 
              userAnswer === correctAnswer ||
              userAnswer?.startsWith(correctAnswer) ||
              correctAnswer?.startsWith(userAnswer) ||
              userLetter === correctLetter;
            
            return (
              <div key={idx} className="pp-quiz-review-item">
                <p className="pp-quiz-review-question">
                  {idx + 1}. {q.question}
                </p>
                <p className={`pp-quiz-review-answer ${
                  isCorrect ? "pp-quiz-review-correct" : "pp-quiz-review-incorrect"
                }`}>
                  Your answer: {userAnswer} {isCorrect ? "✓" : "✗"}
                </p>
                {!isCorrect && (
                  <p className="pp-quiz-review-answer pp-quiz-review-correct">
                    Correct answer: {correctAnswer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}