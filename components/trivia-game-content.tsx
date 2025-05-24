// components/trivia-game-content.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { fetchRandomTriviaQuestions, saveQuestionAnswer, saveTriviaGameScore } from "@/lib/supabase-data"
import ScoreDisplay from "@/components/score-display"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export default function TriviaGameContent() {
  const { t, language } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [timerActive, setTimerActive] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [error, setError] = useState(null)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  // Debug logging for auth state
  useEffect(() => {
    console.log("Auth state in trivia game:", { 
      user: user?.id || "No user", 
      loading: authLoading 
    });
  }, [user, authLoading]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const data = await fetchRandomTriviaQuestions(language, 5)

        if (!data || data.length === 0) {
          setError("No questions available")
          setLoading(false)
          return
        }

        const validQuestions = data.filter(
          (q) =>
            q && q.question && q.answers && Array.isArray(q.answers) && q.correctAnswer !== undefined && q.language,
        )

        if (validQuestions.length === 0) {
          setError("No valid questions found")
          setLoading(false)
          return
        }

        setQuestions(validQuestions)
        setLoading(false)
        setTimerActive(true)
      } catch (error) {
        console.error("Error loading trivia questions:", error)
        setError("Error loading questions")
        setLoading(false)
      }
    }

    loadData()
  }, [language])

  useEffect(() => {
    let timer
    if (timerActive && timeLeft > 0 && !isAnswered) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswer(null)
    }

    return () => clearTimeout(timer)
  }, [timeLeft, timerActive, isAnswered])

  const handleAnswer = async (answerIndex) => {
    setSelectedAnswer(answerIndex)
    setIsAnswered(true)
    setTimerActive(false)

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    const isCorrect = answerIndex === currentQuestion.correctAnswer
    const timeBonus = Math.round((timeLeft / 15) * 50)
    const questionScore = isCorrect ? 50 + timeBonus : 0

    if (isCorrect) {
      setScore((prevScore) => prevScore + questionScore)
      setCorrectAnswers((prev) => prev + 1)
    }

    // Get fresh user state at save time
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Save the answer
    try {
      await saveQuestionAnswer(
        currentUser?.id || null, // Use fresh user data
        currentQuestion.id,
        language,
        answerIndex !== null ? answerIndex : -1,
        isCorrect,
        15 - timeLeft,
        questionScore,
        currentUser?.id ? null : sessionId // Use sessionId only if no user
      )
      console.log("Answer saved successfully")
    } catch (error) {
      console.error("Error saving question answer:", error)
    }
  }

  const nextQuestion = async () => {
    console.log(`Question ${currentQuestionIndex + 1}/${questions.length}`);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(15);
      setTimerActive(true);
    } else {
      console.log("Game over reached, about to save score");
      
      // Get the current user state directly from Supabase at save time
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log("Current user at save time:", currentUser?.id || "No user");
      
      try {
        const result = await saveTriviaGameScore(
          currentUser?.id || null, // Use the fresh user data
          score, 
          questions.length, 
          correctAnswers, 
          language,
          currentUser?.id ? null : sessionId // Use sessionId only if no user
        );
        
        if (result) {
          console.log("Game score saved successfully!");
        }
      } catch (error) {
        console.error("Error saving game score:", error);
      }

      alert(`Final Score: ${score}`);
      resetGame();
    }
  };
  
  const resetGame = async () => {
    setLoading(true)
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setTimeLeft(15)
    setCorrectAnswers(0)
    setError(null)

    try {
      const data = await fetchRandomTriviaQuestions(language, 5)
      if (!data || data.length === 0) {
        setError("No questions available")
        setLoading(false)
        return
      }
      setQuestions(data)
      setLoading(false)
      setTimerActive(true)
    } catch (error) {
      console.error("Error loading trivia questions:", error)
      setError("Error loading questions")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 mx-auto animate-spin text-teal-600 dark:text-teal-400" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center max-w-md p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">Error</h2>
          <p className="mb-6 text-slate-600 dark:text-slate-400">{error}</p>
          <Button onClick={resetGame} className="bg-teal-600 hover:bg-teal-700 text-white">
            Try Again
          </Button>
          <Link href="/" className="block mt-4">
            <Button variant="outline" className="w-full">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!questions.length || !questions[currentQuestionIndex]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center max-w-md p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-amber-600 dark:text-amber-400">No Questions</h2>
          <p className="mb-6 text-slate-600 dark:text-slate-400">No questions available</p>
          <Button onClick={resetGame} className="bg-teal-600 hover:bg-teal-700 text-white">
            Try Again
          </Button>
          <Link href="/" className="block mt-4">
            <Button variant="outline" className="w-full">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm py-1 px-3">
              Question {currentQuestionIndex + 1}/{questions.length}
            </Badge>
            <ScoreDisplay score={score} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-slate-800 dark:text-white">Harbor Trivia</CardTitle>
                <Badge className={`${timeLeft < 5 ? "bg-red-500" : timeLeft < 10 ? "bg-amber-500" : "bg-green-500"}`}>
                  {timeLeft}s
                </Badge>
              </div>
              <Progress value={progress} className="h-2 mt-2" />
            </CardHeader>

            <CardContent className="pt-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-slate-800 dark:text-white">{currentQuestion.question}</h3>

                <div className="space-y-3">
                  {currentQuestion.answers &&
                    currentQuestion.answers.map((answer, index) => (
                      <Button
                        key={index}
                        variant={
                          isAnswered
                            ? index === currentQuestion.correctAnswer
                              ? "default"
                              : index === selectedAnswer && index !== currentQuestion.correctAnswer
                                ? "destructive"
                                : "outline"
                            : "outline"
                        }
                        className={`w-full justify-start text-left h-auto py-3 px-4 ${
                          isAnswered && index === currentQuestion.correctAnswer
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : isAnswered && index === selectedAnswer && index !== currentQuestion.correctAnswer
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : isAnswered && index !== selectedAnswer && index !== currentQuestion.correctAnswer
                            ? "opacity-60"
                            : ""
                        }`}
                        onClick={() => !isAnswered && handleAnswer(index)}
                        disabled={isAnswered}
                      >
                        <div className="flex items-center w-full">
                          <span className="flex-1">{answer}</span>
                          {isAnswered && index === currentQuestion.correctAnswer && (
                            <Check className="h-5 w-5 text-white ml-2" />
                          )}
                          {isAnswered && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                            <X className="h-5 w-5 text-white ml-2" />
                          )}
                        </div>
                      </Button>
                    ))}
                </div>
              </div>
            </CardContent>

            {isAnswered && (
              <CardFooter className="border-t pt-4">
                <div className="w-full">
                  <p className="text-sm mb-3 text-slate-600 dark:text-slate-400">{currentQuestion.explanation}</p>
                  <Button onClick={nextQuestion} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                    {currentQuestionIndex < questions.length - 1
                      ? "Next Question"
                      : "See Final Score"}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
