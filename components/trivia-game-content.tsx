// components/trivia-game-content.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { saveTriviaGameScore } from "@/lib/supabase-data"
import { fetchTriviaFromWorker } from "@/lib/worker-data"
import ScoreDisplay from "@/components/score-display"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

// Import shared game components
import NicknameModal from "@/components/game/nickname-modal"
import GameResultsModal from "@/components/game/game-results-modal"

// Constants
const QUESTIONS_PER_GAME = 5
const TIME_PER_QUESTION = 15

export default function TriviaGameContent() {
  const { t } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const [allQuestions, setAllQuestions] = useState([])
  const [gameQuestions, setGameQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION)
  const [timerActive, setTimerActive] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [error, setError] = useState(null)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  // Game completion states
  const [gameStartTime, setGameStartTime] = useState(null)
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [userNickname, setUserNickname] = useState("")
  const [answerHistory, setAnswerHistory] = useState([])
  const [gameFinished, setGameFinished] = useState(false)

  // Debug logging for auth state
  useEffect(() => {
    console.log("Auth state in trivia game:", { 
      user: user?.id || "No user", 
      loading: authLoading 
    });
  }, [user, authLoading]);

  // Shuffle array utility function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const data = await fetchTriviaFromWorker()

        if (!data || data.length === 0) {
          setError(t("triviaGame.noQuestionsMessage"))
          setLoading(false)
          return
        }

        const validQuestions = data.filter(
          (q) =>
            q && q.question && q.answers && Array.isArray(q.answers) && q.correctAnswer !== undefined && q.language,
        )

        if (validQuestions.length === 0) {
          setError(t("triviaGame.noQuestionsMessage"))
          setLoading(false)
          return
        }

        // Store all questions and select random 5 for this game
        setAllQuestions(validQuestions)
        const shuffledQuestions = shuffleArray(validQuestions)
        const selectedQuestions = shuffledQuestions.slice(0, QUESTIONS_PER_GAME)
        setGameQuestions(selectedQuestions)
        
        setLoading(false)
        setTimerActive(true)
        setGameStartTime(Date.now())
        console.log(`Started trivia game with ${selectedQuestions.length} questions (selected from ${validQuestions.length} total)`)
      } catch (error) {
        console.error("Error loading trivia questions:", error)
        setError(t("triviaGame.errorLoadingQuestions"))
        setLoading(false)
      }
    }

    loadData()
  }, [t])

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

    const currentQuestion = gameQuestions[currentQuestionIndex]
    if (!currentQuestion) return

    const isCorrect = answerIndex === currentQuestion.correctAnswer
    const timeBonus = Math.round((timeLeft / TIME_PER_QUESTION) * 50)
    const questionScore = isCorrect ? 50 + timeBonus : 0

    if (isCorrect) {
      setScore((prevScore) => prevScore + questionScore)
      setCorrectAnswers((prev) => prev + 1)
    }

    // Store answer in history for final save (NO DATABASE CALLS HERE)
    const answerRecord = {
      questionId: currentQuestion.id,
      answerIndex: answerIndex !== null ? answerIndex : -1,
      correct: isCorrect,
      timeTaken: TIME_PER_QUESTION - timeLeft,
      score: questionScore,
      timestamp: Date.now()
    }
    
    setAnswerHistory(prev => [...prev, answerRecord])
    console.log("Answer stored locally:", answerRecord)
  }

  const nextQuestion = async () => {
    console.log(`Question ${currentQuestionIndex + 1}/${gameQuestions.length}`);
    
    if (currentQuestionIndex < gameQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(TIME_PER_QUESTION);
      setTimerActive(true);
    } else {
      console.log("Game completed! Preparing results...");
      setGameFinished(true)
      setTimerActive(false)
      
      // Get the current user state directly from Supabase at save time
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log("Current user at save time:", currentUser?.id || "No user");
      
      // Check if anonymous user wants to add nickname
      if (!currentUser?.id) {
        setShowNicknameModal(true);
      } else {
        // Save score immediately for logged-in users and show results
        await saveFinalScore(currentUser);
        setShowResultsModal(true);
      }
    }
  };

  const saveFinalScore = async (currentUser, nickname = null) => {
    try {
      const gameDuration = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : null;
      
      console.log("Saving final game score:", {
        userId: currentUser?.id || null,
        score,
        totalQuestions: gameQuestions.length,
        correctAnswers,
        sessionId: currentUser?.id ? null : sessionId,
        gameDuration,
        nickname: nickname || userNickname || null,
        answerHistory: answerHistory.length
      });

      const result = await saveTriviaGameScore(
        currentUser?.id || null,
        score, 
        gameQuestions.length, 
        correctAnswers, 
        currentUser?.id ? null : sessionId,
        gameDuration,
        nickname || userNickname || null
      );
      
      if (result) {
        console.log("Game score saved successfully!");
      }
      
      return true;
    } catch (error) {
      console.error("Error saving game score:", error);
      return false;
    }
  };

  const handleNicknameSubmit = async (nickname) => {
    setUserNickname(nickname);
    setShowNicknameModal(false);
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await saveFinalScore(currentUser, nickname);
    setShowResultsModal(true);
  };

  const handleNicknameSkip = async () => {
    setShowNicknameModal(false);
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await saveFinalScore(currentUser);
    setShowResultsModal(true);
  };

  const handlePlayAgain = () => {
    setShowResultsModal(false);
    resetGame();
  };

  
  const resetGame = async () => {
    setLoading(true)
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setTimeLeft(TIME_PER_QUESTION)
    setCorrectAnswers(0)
    setError(null)
    setGameStartTime(null)
    setAnswerHistory([])
    setShowNicknameModal(false)
    setShowResultsModal(false)
    setUserNickname("")
    setGameFinished(false)

    try {
      const data = await fetchTriviaFromWorker()
      if (!data || data.length === 0) {
        setError(t("triviaGame.noQuestionsMessage"))
        setLoading(false)
        return
      }
      
      // Select new random 5 questions
      const validQuestions = data.filter(
        (q) =>
          q && q.question && q.answers && Array.isArray(q.answers) && q.correctAnswer !== undefined && q.language,
      )
      
      setAllQuestions(validQuestions)
      const shuffledQuestions = shuffleArray(validQuestions)
      const selectedQuestions = shuffledQuestions.slice(0, QUESTIONS_PER_GAME)
      setGameQuestions(selectedQuestions)
      
      setLoading(false)
      setTimerActive(true)
      setGameStartTime(Date.now())
      console.log(`New trivia game started with ${selectedQuestions.length} questions`)
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

  if (!gameQuestions.length || !gameQuestions[currentQuestionIndex]) {
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

  const currentQuestion = gameQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / gameQuestions.length) * 100

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
              {t("triviaGame.question")} {currentQuestionIndex + 1}/{gameQuestions.length}
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
                  {timeLeft}{t("triviaGame.timeLeft")}
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
                    {currentQuestionIndex < gameQuestions.length - 1
                      ? t("triviaGame.nextQuestion")
                      : t("triviaGame.seeFinalScore")}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Nickname Modal */}
        <NicknameModal
          show={showNicknameModal}
          onSubmit={handleNicknameSubmit}
          onSkip={handleNicknameSkip}
        />

        {/* Results Modal */}
        <GameResultsModal
          show={showResultsModal}
          score={score}
          totalQuestions={gameQuestions.length}
          correctAnswers={correctAnswers}
          gameDuration={gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : undefined}
          onPlayAgain={handlePlayAgain}
          onReturnHome={() => {}} // This can be empty since Link handles navigation
        />
      </div>
    </div>
  )
}