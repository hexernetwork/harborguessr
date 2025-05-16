"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { fetchHarborTrivia, getUserLanguage } from "@/lib/data"
import { getTranslations } from "@/lib/db-utils"
import ScoreDisplay from "@/components/score-display"

export default function TriviaGame() {
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [timerActive, setTimerActive] = useState(false)
  const [language, setLanguage] = useState("en")
  const [translations, setTranslations] = useState({})

  useEffect(() => {
    // Get user's preferred language
    const userLang = getUserLanguage()
    setLanguage(userLang)
    setTranslations(getTranslations(userLang))

    async function loadData() {
      const data = await fetchHarborTrivia(userLang)
      setQuestions(data)
      setLoading(false)
      setTimerActive(true)
    }

    loadData()
  }, [])

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

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex)
    setIsAnswered(true)
    setTimerActive(false)

    const currentQuestion = questions[currentQuestionIndex]

    if (answerIndex === currentQuestion.correctAnswer) {
      // Calculate score based on time left
      const timeBonus = Math.round((timeLeft / 15) * 50)
      const questionScore = 50 + timeBonus
      setScore((prevScore) => prevScore + questionScore)
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
      // Game over - would show final score and restart option
      alert(`Game Over! Final Score: ${score}`)
      resetGame()
    }
  }

  const resetGame = () => {
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setTimeLeft(15)
    setTimerActive(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 mx-auto animate-spin text-teal-600 dark:text-teal-400" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            {translations.loadingTrivia || "Loading trivia questions..."}
          </p>
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
              {translations.backToHome || "Back to Home"}
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm py-1 px-3">
              {translations.question || "Question"} {currentQuestionIndex + 1}/{questions.length}
            </Badge>
            <ScoreDisplay score={score} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-slate-800 dark:text-white">
                  {translations.harborTrivia || "Harbor Trivia"}
                </CardTitle>
                <Badge className={`${timeLeft < 5 ? "bg-red-500" : timeLeft < 10 ? "bg-amber-500" : "bg-green-500"}`}>
                  {timeLeft}s
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
                  {currentQuestion.answers.map((answer, index) => (
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
                  <Button onClick={nextQuestion} className="w-full bg-teal-600 hover:bg-teal-700">
                    {currentQuestionIndex < questions.length - 1
                      ? translations.nextQuestion || "Next Question"
                      : translations.seeFinalScore || "See Final Score"}
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
