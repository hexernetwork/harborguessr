"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { fetchRandomTriviaQuestions } from "@/lib/data"
import ScoreDisplay from "@/components/score-display"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { saveQuestionAnswer, saveTriviaGameScore } from "@/lib/data"

export default function TriviaGameContent() {
  const { t, language } = useLanguage()
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [timerActive, setTimerActive] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [gameId, setGameId] = useState(null)
  const [error, setError] = useState(null)

  const auth = useAuth()
  const user = auth?.user || null

  useEffect(() => {
    // Generate a unique game ID for this session
    setGameId(Date.now().toString())

    async function loadData() {
      try {
        setLoading(true)
        // Fetch 5 random trivia questions based on view count
        const data = await fetchRandomTriviaQuestions(language, 5)

        if (!data || data.length === 0) {
          setError(t("triviaGame.noQuestionsMessage"))
          setLoading(false)
          return
        }

        // Validate that each question has the required fields
        const validQuestions = data.filter(
          (q) =>
            q && q.question && q.answers && Array.isArray(q.answers) && q.correctAnswer !== undefined && q.language,
        )

        if (validQuestions.length === 0) {
          setError(t("triviaGame.errorLoadingQuestions"))
          setLoading(false)
          return
        }

        setQuestions(validQuestions)
        setLoading(false)
        setTimerActive(true)
      } catch (error) {
        console.error("Error loading trivia questions:", error)
        setError(t("triviaGame.errorLoadingQuestions"))
        setLoading(false)
      }
    }

    loadData()
  }, [language, t])

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

    // Calculate score based on time left
    const timeBonus = Math.round((timeLeft / 15) * 50)
    const questionScore = isCorrect ? 50 + timeBonus : 0

    if (isCorrect) {
      setScore((prevScore) => prevScore + questionScore)
      setCorrectAnswers((prev) => prev + 1)
    }

    // Save the answer to Supabase if user is logged in
    if (user) {
      try {
        await saveQuestionAnswer(
          user.id,
          currentQuestion.id,
          language,
          answerIndex !== null ? answerIndex : -1, // Use -1 for timeout
          isCorrect,
          15 - timeLeft, // Time taken in seconds
          questionScore,
        )
      } catch (error) {
        console.error("Error saving question answer:", error)
      }
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setTimeLeft(15)
      setTimerActive(true)
    } else {
      // Game over - save final score if user is logged in
      if (user) {
        try {
          saveTriviaGameScore(user.id, score, questions.length, correctAnswers, language)
        } catch (error) {
          console.error("Error saving game score:", error)
        }
      }

      // Show final score
      alert(t("triviaGame.finalScore", { score }))
      resetGame()
    }
  }

  const resetGame = async () => {
    setLoading(true)
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setTimeLeft(15)
    setCorrectAnswers(0)
    setGameId(Date.now().toString())
    setError(null)

    try {
      // Fetch new random questions
      const data = await fetchRandomTriviaQuestions(language, 5)
      if (!data || data.length === 0) {
        setError(t("triviaGame.noQuestionsMessage"))
        setLoading(false)
        return
      }
      setQuestions(data)
      setLoading(false)
      setTimerActive(true)
    } catch (error) {
      console.error("Error loading trivia questions:", error)
      setError(t("triviaGame.errorLoadingQuestions"))
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 mx-auto animate-spin text-teal-600 dark:text-teal-400" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">{t("triviaGame.loadingQuestions")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center max-w-md p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">{t("common.error")}</h2>
          <p className="mb-6 text-slate-600 dark:text-slate-400">{error}</p>
          <Button onClick={resetGame} className="bg-teal-600 hover:bg-teal-700 text-white">
            {t("common.tryAgain")}
          </Button>
          <Link href="/" className="block mt-4">
            <Button variant="outline" className="w-full">
              {t("common.returnHome")}
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
          <h2 className="text-xl font-bold mb-4 text-amber-600 dark:text-amber-400">{t("triviaGame.noQuestions")}</h2>
          <p className="mb-6 text-slate-600 dark:text-slate-400">{t("triviaGame.noQuestionsMessage")}</p>
          <Button onClick={resetGame} className="bg-teal-600 hover:bg-teal-700 text-white">
            {t("common.tryAgain")}
          </Button>
          <Link href="/" className="block mt-4">
            <Button variant="outline" className="w-full">
              {t("common.returnHome")}
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
              {t("common.back")}
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm py-1 px-3">
              {t("triviaGame.question")} {currentQuestionIndex + 1}/{questions.length}
            </Badge>
            <ScoreDisplay score={score} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-slate-800 dark:text-white">{t("triviaGame.title")}</CardTitle>
                <Badge className={`${timeLeft < 5 ? "bg-red-500" : timeLeft < 10 ? "bg-amber-500" : "bg-green-500"}`}>
                  {timeLeft}
                  {t("triviaGame.timeLeft")}
                </Badge>
              </div>
              <Progress value={progress} className="h-2 mt-2" />
            </CardHeader>

            <CardContent className="pt-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-slate-800 dark:text-white">{currentQuestion.question}</h3>

                {currentQuestion.image && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={currentQuestion.image || "/placeholder.svg"}
                      alt="Harbor"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {currentQuestion.answers &&
                    currentQuestion.answers.map((answer, index) => (
                      <Button
                        key={index}
                        variant={
                          isAnswered
                            ? index === currentQuestion.correctAnswer
                              ? "success"
                              : index === selectedAnswer && index !== currentQuestion.correctAnswer
                                ? "destructive"
                                : "outline"
                            : "outline"
                        }
                        className={`w-full justify-start text-left h-auto py-3 px-4 ${
                          isAnswered && index !== selectedAnswer && index !== currentQuestion.correctAnswer
                            ? "opacity-60"
                            : ""
                        }`}
                        onClick={() => !isAnswered && handleAnswer(index)}
                        disabled={isAnswered}
                      >
                        <div className="flex items-center w-full">
                          <span className="flex-1">{answer}</span>
                          {isAnswered && index === currentQuestion.correctAnswer && (
                            <Check className="h-5 w-5 text-green-500 ml-2" />
                          )}
                          {isAnswered && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                            <X className="h-5 w-5 text-red-500 ml-2" />
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
                      ? t("triviaGame.nextQuestion")
                      : t("triviaGame.seeFinalScore")}
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
