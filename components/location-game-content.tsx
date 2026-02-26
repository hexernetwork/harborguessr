// components/location-game-content.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Ship, Eye, EyeOff, Search, Anchor, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import MapComponent from "@/components/map-component"
import ScoreDisplay from "@/components/score-display"
import NicknameModal from "@/components/game/nickname-modal"
import LocationGameResultsModal from "@/components/game/location-game-results-modal"
import GameSuccessModal from "@/components/game/game-success-modal"

async function fetchHarborsFromWorker(language) {
  try {
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL
    if (!workerUrl) throw new Error('NEXT_PUBLIC_WORKER_URL environment variable is not set')
    const response = await fetch(`${workerUrl}/harbors?lang=${language}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`Worker API error: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching harbors from worker:', error)
    const { data, error: supabaseError } = await supabase
      .from("harbors")
      .select(`*, harbor_hints!inner(hint_text, hint_order)`)
      .eq("language", language)
      .order("view_count", { ascending: true })
    if (supabaseError) return []
    return data.map(harbor => ({
      ...harbor,
      hints: harbor.harbor_hints
        .sort((a, b) => a.hint_order - b.hint_order)
        .map(hint => hint.hint_text)
    }))
  }
}

export default function LocationGameContent() {
  const { t, language } = useLanguage()
  const { user } = useAuth()

  // All state declarations first
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentHarbor, setCurrentHarbor] = useState(null)
  const [harbors, setHarbors] = useState([])
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [feedback, setFeedback] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showHarborNames, setShowHarborNames] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchedLocation, setSearchedLocation] = useState(null)
  const [currentRandomHint, setCurrentRandomHint] = useState<string | null>(null)
  const [gameHistory, setGameHistory] = useState([])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [gameStartTime, setGameStartTime] = useState(null)
  const [hasGuessed, setHasGuessed] = useState(false)
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [userNickname, setUserNickname] = useState("")
  const [showFinalResults, setShowFinalResults] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastGuessLocation, setLastGuessLocation] = useState(null)

  // All refs after states
  const mapRef = useRef<{ resetMapView: () => void }>(null)

  // Track dark mode changes - moved after all state declarations
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }

    // Check initially
    checkDarkMode()

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Helper functions
  const getCurrentHarborState = () => {
    const currentGuesses = gameHistory.filter(g => g.harborId === currentHarbor?.id)
    const hasCorrectAnswer = currentGuesses.some(g => g.correct)
    const guessCount = currentGuesses.length
    const isComplete = hasCorrectAnswer || guessCount >= 1
    return { currentGuesses, hasCorrectAnswer, guessCount, isComplete }
  }

  const selectRandomHarbor = (harborList) => {
    if (!harborList || harborList.length === 0) return
    const harbor = harborList[Math.floor(Math.random() * harborList.length)]
    const availableHints = harbor.hints?.filter(h => h?.trim()) || []
    const randomHint = availableHints.length > 0
      ? availableHints[Math.floor(Math.random() * availableHints.length)]
      : null
    setCurrentHarbor(harbor)
    setCurrentRandomHint(randomHint)
    setSelectedLocation(null)
    setLastGuessLocation(null)
    setSearchedLocation(null)
    setFeedback(null)
    setHasGuessed(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const found = harbors.find(h =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (found) {
      setSelectedLocation({ lat: found.coordinates.lat, lng: found.coordinates.lng })
      setSearchedLocation({
        lat: found.coordinates.lat,
        lng: found.coordinates.lng,
        name: found.name,
      })
      setSearchQuery("")
    } else {
      setFeedback({
        type: "warning",
        message: `${t("common.noResults")}: "${searchQuery}"`,
      })
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const handleGuess = async () => {
    if (!selectedLocation || !currentHarbor || hasGuessed) return

    const { lat: aLat, lng: aLng } = currentHarbor.coordinates
    const { lat: sLat, lng: sLng } = selectedLocation

    const R = 6371
    const dLat = ((aLat - sLat) * Math.PI) / 180
    const dLng = ((aLng - sLng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((sLat * Math.PI) / 180) * Math.cos((aLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const isCorrect = distance <= 20
    setLastGuessLocation(selectedLocation)

    let attemptScore = 0
    if (isCorrect) {
      attemptScore = 100
      setScore(prev => prev + attemptScore)
    }

    setGameHistory(prev => [...prev, {
      harborId: currentHarbor.id,
      harborName: currentHarbor.name,
      round,
      attempts: 1,
      distance: Math.round(distance),
      correct: isCorrect,
      score: attemptScore,
      timestamp: Date.now(),
      selectedLocation,
    }])

    setHasGuessed(true)
    setSelectedLocation(null)
    setSearchedLocation(null)

    if (isCorrect) {
      setFeedback({
        type: "success",
        message: t("locationGame.correctMessage", { harborName: currentHarbor.name, score: attemptScore }),
      })
      setShowSuccessModal(true)
    } else {
      setFeedback({
        type: "warning",
        message: `${t("locationGame.tryAgain")}: ${Math.round(distance)} km`,
      })
    }
  }

  const saveCompleteGameToSupabase = async (nickname = null) => {
    if (gameCompleted) return;

    try {
      console.log("Saving game to Supabase...");
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const gameDuration = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0;

      const sessionId = currentUser?.id
        ? null
        : `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const correctAnswers = gameHistory.filter(g => g.correct).length;

      const gameData = {
        game_type: 'location',
        score: score,
        language: language,
        completed_at: new Date().toISOString(),
        user_id: currentUser?.id || null,
        session_id: sessionId,
        nickname: nickname || null,
        game_duration_seconds: gameDuration,
        questions_answered: round,
        correct_answers: correctAnswers,
        metadata: {
          rounds: round,
          game_history: gameHistory.map(g => ({
            harborId: g.harborId,
            harborName: g.harborName,
            distance: g.distance,
            correct: g.correct,
            score: g.score
          }))
        }
      };

      console.log("Game data to save:", gameData);

      const { data: gameScore, error: scoreError } = await supabase
        .from('game_scores')
        .insert(gameData)
        .select()
        .single();

      if (scoreError) {
        console.error("Error saving game score:", scoreError);
        throw scoreError;
      }

      console.log("Game score saved successfully:", gameScore.id);

      const { error: leaderboardError } = await supabase
        .from('leaderboard_entries')
        .insert({
          game_score_id: gameScore.id,
          user_id: currentUser?.id || null,
          session_id: sessionId,
          nickname: nickname || null,
          game_type: 'location',
          score: score,
          language: language,
          completed_at: new Date().toISOString(),
          game_duration_seconds: gameDuration,
          questions_answered: round,
          correct_answers: correctAnswers
        });

      if (leaderboardError) {
        console.error("Error saving leaderboard entry:", leaderboardError);
        throw leaderboardError;
      }

      console.log("Game successfully saved to Supabase");
      setGameCompleted(true);
      setShowFinalResults(true);
      return true;
    } catch (error) {
      console.error("Error saving game:", error);
      setGameCompleted(true);
      setShowFinalResults(true);
      return false;
    }
  };

  const nextRound = () => {
    if (round < 3) {
      setRound(prev => prev + 1)
      selectRandomHarbor(harbors)
      setHasGuessed(false)
      setFeedback(null)

      if (mapRef.current) {
        mapRef.current.resetMapView()
      }
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user?.id) {
          setShowNicknameModal(true)
        } else {
          saveCompleteGameToSupabase().then(() => {
            setShowFinalResults(true)
          })
        }
      })
    }
  }

  const handleNicknameSubmit = (nickname) => {
    setUserNickname(nickname)
    setShowNicknameModal(false)
    saveCompleteGameToSupabase(nickname).then(() => {
      setShowFinalResults(true)
    })
  }

  const handleNicknameSkip = () => {
    setShowNicknameModal(false)
    saveCompleteGameToSupabase().then(() => {
      setShowFinalResults(true)
    })
  }

  const resetGame = () => {
    setRound(1)
    setScore(0)
    setGameHistory([])
    setGameCompleted(false)
    setShowFinalResults(false)
    setGameStartTime(Date.now())
    selectRandomHarbor(harbors)
    setHasGuessed(false)
    setFeedback(null)

    if (mapRef.current) {
      mapRef.current.resetMapView()
    }
  }

  // Initialization
  useEffect(() => {
    if (!language) return
    const initializeGame = async () => {
      try {
        const data = await fetchHarborsFromWorker(language)
        if (data && data.length > 0) {
          const correctLanguageHarbors = data.filter(h => h.language === language)
          const finalHarbors = correctLanguageHarbors.length > 0 ? correctLanguageHarbors : data
          setHarbors(finalHarbors)
          selectRandomHarbor(finalHarbors)
          setGameStarted(true)
          setGameStartTime(Date.now())
        }
      } catch (error) {
        console.error("Error initializing game:", error)
        setFeedback({ type: "error", message: t("errors.generic") })
      } finally {
        setLoading(false)
      }
    }
    initializeGame()
  }, [language])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 sm:h-10 sm:w-10 mx-auto animate-spin text-blue-600 dark:text-blue-400" />
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {t("common.loading")}
          </p>
        </div>
      </div>
    )
  }

  const currentState = getCurrentHarborState()
  const mapSelectedLocation = hasGuessed ? lastGuessLocation : selectedLocation
  const mapActualLocation = hasGuessed ? currentHarbor?.coordinates : null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 lg:py-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              {t("common.back")}
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-blue-600 text-white text-xs font-medium py-1 px-2 sm:py-1.5 sm:px-3 rounded-full shadow-md">
              {t("locationGame.round")} {round}/3
            </div>
            <Button onClick={resetGame} variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
              <RotateCcw className="h-3 w-3" />
              {t("gameResults.playAgain")}
            </Button>
            <ScoreDisplay score={score} />
          </div>
        </div>

        <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          {/* Left panel */}
          <Card className="lg:col-span-1">
            <CardContent className="p-3 sm:p-4">
              {/* Game content */}
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Anchor className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 dark:text-white truncate">
                  {t("locationGame.title")}
                </h2>
              </div>

              {/* Status */}
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-blue-800 dark:text-blue-300">
                    {t("locationGame.guessesRemaining")}: {hasGuessed ? 0 : 1}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {selectedLocation ? "✓ " + t("map.locationSelected") : t("map.clickToSelect")}
                  </span>
                </div>
              </div>

              {/* Feedback */}
              {feedback && (
                <Alert className={`mb-3 sm:mb-4 ${
                  feedback.type === "success" ? "bg-green-50 border-green-200 dark:bg-green-900/20" :
                  feedback.type === "error" ? "bg-red-50 border-red-200 dark:bg-red-900/20" :
                  "bg-amber-50 border-amber-200 dark:bg-amber-900/20"
                }`}>
                  <AlertTitle className={`text-sm sm:text-base ${
                    feedback.type === "success" ? "text-green-800 dark:text-green-300" :
                    feedback.type === "error" ? "text-red-800 dark:text-red-300" :
                    "text-amber-800 dark:text-amber-300"
                  }`}>
                    {feedback.type === "success" ? t("locationGame.correct") :
                     feedback.type === "error" ? t("locationGame.gameOver") :
                     t("locationGame.tryAgain")}
                  </AlertTitle>
                  <AlertDescription className={`text-xs sm:text-sm ${
                    feedback.type === "success" ? "text-green-700 dark:text-green-400" :
                    feedback.type === "error" ? "text-red-700 dark:text-red-400" :
                    "text-amber-700 dark:text-amber-400"
                  }`}>
                    {feedback.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Single random hint */}
              <div className="mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Vihje
                </h3>
                <div className="p-1.5 sm:p-2 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {currentRandomHint?.startsWith("http") ? (
                    <img
                      src={currentRandomHint}
                      alt="Sataman vihje"
                      className="w-full h-32 sm:h-40 object-cover rounded-md border border-slate-200 dark:border-slate-600"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = "none" }}
                    />
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {currentRandomHint || "—"}
                    </p>
                  )}
                </div>
              </div>

              {/* Reveal harbor info after guess */}
              {hasGuessed && currentHarbor && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-800 dark:text-white text-sm sm:text-base truncate">
                      {currentHarbor.name}
                    </h3>
                    {currentState.hasCorrectAnswer && (
                      <span className="text-green-600 dark:text-green-400 text-sm flex-shrink-0">✓</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {currentHarbor.description || t("common.noData")}
                  </p>
                </div>
              )}

              {/* Map controls + search */}
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {showHarborNames
                      ? <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                      : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500 dark:text-slate-400" />}
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                      {t("map.showHarborNames")}
                    </span>
                  </div>
                  <Switch checked={showHarborNames} onCheckedChange={setShowHarborNames} />
                </div>

                <form onSubmit={handleSearch} className="flex gap-1 sm:gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder={t("map.searchHarbor")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 sm:pl-8 text-xs sm:text-sm h-8 sm:h-10"
                      disabled={hasGuessed}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    className="px-2 sm:px-3 text-xs sm:text-sm h-8 sm:h-10"
                    disabled={hasGuessed}
                  >
                    {t("common.find")}
                  </Button>
                </form>
              </div>

              {/* Guess / next round button */}
              {!hasGuessed ? (
                <Button
                  onClick={handleGuess}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base py-3"
                  disabled={!selectedLocation}
                >
                  <Anchor className="mr-2 h-4 w-4" />
                  {t("locationGame.confirmGuess")}
                </Button>
              ) : (
                <Button
                  onClick={() => nextRound()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base py-3"
                >
                  {round < 3 ? t("locationGame.nextHarbor") : t("locationGame.seeFinalScore")}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Map */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <div className="p-2 sm:p-3 lg:p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-medium text-slate-800 dark:text-white flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                <Ship className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                {t("locationGame.mapTitle")}
              </h3>
            </div>
            <div className="h-[60vh] min-h-[400px] sm:h-[65vh] sm:min-h-[450px] lg:h-[500px]">
              <MapComponent
                ref={mapRef}
                selectedLocation={mapSelectedLocation}
                setSelectedLocation={hasGuessed ? null : setSelectedLocation}
                actualLocation={mapActualLocation}
                harborName={hasGuessed ? currentHarbor?.name : null}
                showFinland={true}
                showHarborNames={showHarborNames}
                harborData={harbors}
                searchedLocation={searchedLocation}
                gameHistory={currentHarbor ? gameHistory.filter(g => g.harborId === currentHarbor.id) : []}
                currentHarbor={currentHarbor}
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        <NicknameModal
          show={showNicknameModal}
          onSubmit={handleNicknameSubmit}
          onSkip={handleNicknameSkip}
        />
        <LocationGameResultsModal
          show={showFinalResults}
          score={score}
          gameHistory={gameHistory}
          gameDuration={gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : undefined}
          onPlayAgain={resetGame}
          onClose={() => setShowFinalResults(false)}
        />
        <GameSuccessModal
          show={showSuccessModal}
          message={feedback?.message || ""}
          onContinue={() => {
            setShowSuccessModal(false)
            nextRound()
          }}
        />
      </div>
    </div>
  )
}
