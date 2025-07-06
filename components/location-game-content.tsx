// components/location-game-content.tsx - TESTING VERSION WITH ELISAARI ONLY
"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Ship, Info, Eye, EyeOff, Search, Anchor, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { saveLocationGameScore } from "@/lib/supabase-data"
import { 
  saveGameState, 
  loadGameState, 
  clearGameState, 
  saveHarborData, 
  loadCachedHarborData,
  debugLocalStorage
} from "@/lib/game-state-manager"
import MapComponent from "@/components/map-component"
import ScoreDisplay from "@/components/score-display"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

// Import shared game components
import NicknameModal from "@/components/game/nickname-modal"
import LocationGameResultsModal from "@/components/game/location-game-results-modal"
import GameSuccessModal from "@/components/game/game-success-modal"
import GameRestorePrompt from "@/components/game/game-restore-prompt"

async function fetchHarborsFromWorker(language) {
  try {
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL
    
    if (!workerUrl) {
      throw new Error('NEXT_PUBLIC_WORKER_URL environment variable is not set')
    }
    
    console.log(`Fetching harbors from worker cache: ${workerUrl}/harbors?lang=${language}`)
    
    const response = await fetch(`${workerUrl}/harbors?lang=${language}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Worker API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Fetched ${data.length} harbors from worker cache (${response.headers.get('X-Cache') || 'UNKNOWN'})`)
    
    return data
  } catch (error) {
    console.error('Error fetching harbors from worker:', error)
    
    // Fallback to direct Supabase query if worker fails
    console.log('Falling back to direct Supabase query...')
    const { data, error: supabaseError } = await supabase
      .from("harbors")
      .select(`
        *,
        harbor_hints!inner(hint_text, hint_order)
      `)
      .eq("language", language)
      .order("view_count", { ascending: true })

    if (supabaseError) {
      console.error("Supabase fallback failed:", supabaseError)
      return []
    }

    // Transform the data to include hints properly
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
  const { user, loading: authLoading } = useAuth()
  
  // Core game state
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
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false)
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  const [gameHistory, setGameHistory] = useState([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [showFinalResults, setShowFinalResults] = useState(false)
  
  // Leaderboard support
  const [gameStartTime, setGameStartTime] = useState(null)
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [userNickname, setUserNickname] = useState("")

  // Debug logging for auth state
  useEffect(() => {
    console.log("Auth state in location game:", { 
      user: user?.id || "No user", 
      loading: authLoading 
    });
  }, [user, authLoading]);

  // Helper: Get current harbor guesses and state
  const getCurrentHarborState = () => {
    const currentGuesses = gameHistory.filter(guess => guess.harborId === currentHarbor?.id)
    const hasCorrectAnswer = currentGuesses.some(guess => guess.correct)
    const guessCount = currentGuesses.length
    const currentHintIndex = Math.min(guessCount, 4)
    const isComplete = hasCorrectAnswer || guessCount >= 5
    
    return { currentGuesses, hasCorrectAnswer, guessCount, currentHintIndex, isComplete }
  }

  // Save game state when important things happen
  const saveCurrentGameState = () => {
    if (!gameStarted || !currentHarbor) return
    
    const gameState = {
      currentHarbor,
      harbors,
      score,
      round,
      gameStarted,
      sessionId,
      language,
      gameHistory,
      gameCompleted,
      gameStartTime
    }
    saveGameState(gameState)
    console.log("Game state saved - Round:", round, "Harbor:", currentHarbor.name, "Guesses:", gameHistory.length)
  }

  useEffect(() => {
    debugLocalStorage()
  }, [])

  useEffect(() => {
    if (!language) return
    initializeGame()
  }, [language])

  const initializeGame = async () => {
    try {
      clearGameState()
      await loadGameData()
      
    } catch (error) {
      console.error("Error initializing game:", error)
      setLoading(false)
    }
  }

  const loadGameData = async (savedGame = null) => {
    try {
      const data = await fetchHarborsFromWorker(language)
      
      if (data && data.length > 0) {
        const correctLanguageHarbors = data.filter(harbor => harbor.language === language)
        const finalHarbors = correctLanguageHarbors.length > 0 ? correctLanguageHarbors : data
        
        setHarbors(finalHarbors)
        selectRandomHarbor(finalHarbors)
        setGameStarted(true)
        setGameStartTime(Date.now())
      }
    } catch (error) {
      console.error("Error loading game data:", error)
      setFeedback({ type: "error", message: t("errors.generic") })
    } finally {
      setLoading(false)
    }
  }

  const selectRandomHarbor = (harborList) => {
    if (!harborList || harborList.length === 0) return

    const harbor = harborList[Math.floor(Math.random() * harborList.length)]
    
    setCurrentHarbor(harbor)
    setSelectedLocation(null)
    setFeedback(null)

    if (!gameStartTime && gameStarted) {
      setGameStartTime(Date.now())
    }
    
    if (gameStarted) {
      const immediateGameState = {
        currentHarbor: harbor,
        harbors,
        score,
        round,
        gameStarted,
        sessionId,
        language,
        gameHistory,
        gameCompleted,
        gameStartTime: gameStartTime || Date.now()
      }
      saveGameState(immediateGameState)
      console.log("IMMEDIATE save after harbor selection - Round:", round, "Harbor:", harbor.name)
    }
  }

  const handleGuess = async () => {
    if (!selectedLocation || !currentHarbor) return

    const state = getCurrentHarborState()
    if (state.isComplete) return

    // Calculate distance
    const actualLat = currentHarbor.coordinates.lat
    const actualLng = currentHarbor.coordinates.lng
    const selectedLat = selectedLocation.lat
    const selectedLng = selectedLocation.lng

    const R = 6371
    const dLat = ((actualLat - selectedLat) * Math.PI) / 180
    const dLng = ((actualLng - selectedLng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((selectedLat * Math.PI) / 180) *
        Math.cos((actualLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const calculatedDistance = R * c

    const isCorrect = calculatedDistance <= 20
    const newGuessCount = state.guessCount + 1

    const previousCorrectGuess = gameHistory.find(guess => 
      guess.harborId === currentHarbor.id && guess.correct
    )

    let attemptScore = 0
    if (isCorrect && !previousCorrectGuess) {
      attemptScore = Math.max(100 - (newGuessCount - 1) * 20, 20)
      setScore(prevScore => prevScore + attemptScore)
    }

    const guessRecord = {
      harborId: currentHarbor.id,
      harborName: currentHarbor.name,
      round,
      attempts: newGuessCount,
      distance: Math.round(calculatedDistance),
      correct: isCorrect,
      score: attemptScore,
      timestamp: Date.now(),
      selectedLocation: selectedLocation
    }

    const newHistory = [...gameHistory, guessRecord]
    setGameHistory(newHistory)
    console.log("Added guess to history. Total guesses:", newHistory.length)
    
    const immediateGameState = {
      currentHarbor,
      harbors,
      score: score + attemptScore,
      round,
      gameStarted,
      sessionId,
      language,
      gameHistory: newHistory,
      gameCompleted,
      gameStartTime
    }
    saveGameState(immediateGameState)
    console.log("IMMEDIATE save after guess - Round:", round, "Harbor:", currentHarbor.name, "Guesses:", newHistory.length)
    
    if (isCorrect) {
      if (previousCorrectGuess) {
        setFeedback({
          type: "warning",
          message: `${t("locationGame.correctMessage", { harborName: currentHarbor.name, score: 0 })} (${t("errors.noDataAvailable")})`
        })
      } else {
        setFeedback({
          type: "success",
          message: t("locationGame.correctMessage", { harborName: currentHarbor.name, score: attemptScore })
        })
        setShowSuccessModal(true)
      }
    } else if (newGuessCount >= 5) {
      setFeedback({
        type: "error",
        message: t("locationGame.outOfGuesses", { harborName: currentHarbor.name })
      })
    } else {
      setFeedback({
        type: "warning",
        message: t("locationGame.distanceAway", {
          distance: Math.round(calculatedDistance),
          guessesLeft: 5 - newGuessCount
        })
      })
    }

    setSelectedLocation(null)
  }

  const saveCompleteGameToSupabase = async (nickname = null) => {
    if (gameCompleted) {
      console.log("Game already completed and saved, skipping duplicate save")
      return
    }

    try {
      console.log("Saving complete location game to Supabase...")
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      const gameDuration = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : null
      const correctGuesses = gameHistory.filter(guess => guess.correct).length
      
      await saveLocationGameScore(
        currentUser?.id || null,
        score,
        3,
        currentUser?.id ? null : sessionId,
        gameDuration,
        nickname || userNickname || null
      )
      
      setGameCompleted(true)
      clearGameState()
      
      console.log("Location game successfully saved to Supabase")
    } catch (error) {
      console.error("Error saving complete location game:", error)
    }
  }

  const nextRound = async () => {
    if (round < 3) {
      const newRound = round + 1
      setRound(newRound)
      selectRandomHarbor(harbors)
      
      setTimeout(() => {
        saveCurrentGameState()
      }, 100)
      
    } else {
      // Game completed - check if anonymous user wants to add nickname
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser?.id) {
        setShowNicknameModal(true)
      } else {
        await saveCompleteGameToSupabase()
        setShowFinalResults(true)
        setFeedback(null)
      }
    }
  }

  const handleNicknameSubmit = async (nickname) => {
    setUserNickname(nickname)
    setShowNicknameModal(false)
    await saveCompleteGameToSupabase(nickname)
    setShowFinalResults(true)
    setFeedback(null)
  }

  const handleNicknameSkip = async () => {
    setShowNicknameModal(false)
    await saveCompleteGameToSupabase()
    setShowFinalResults(true)
    setFeedback(null)
  }

  const resetGame = () => {
    clearGameState()
    setRound(1)
    setScore(0)
    setGameHistory([])
    setGameCompleted(false)
    setShowFinalResults(false)
    setGameStartTime(Date.now())
    selectRandomHarbor(harbors)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const foundHarbor = harbors.find(harbor => 
      harbor.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (foundHarbor) {
      setSearchedLocation({
        lat: foundHarbor.coordinates.lat,
        lng: foundHarbor.coordinates.lng,
        name: foundHarbor.name
      })
      setSelectedLocation({
        lat: foundHarbor.coordinates.lat,
        lng: foundHarbor.coordinates.lng
      })
      setSearchQuery("")
    } else {
      setFeedback({
        type: "warning",
        message: `${t("common.noResults")}: "${searchQuery}"`
      })
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 sm:h-10 sm:w-10 mx-auto animate-spin text-blue-600 dark:text-blue-400" />
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  const currentState = getCurrentHarborState()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 lg:py-8">
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
              <span className="hidden xs:inline">{t("gameResults.playAgain")}</span>
              <span className="xs:hidden">Reset</span>
            </Button>
            <ScoreDisplay score={score} />
          </div>
        </div>

        <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          <Card className="lg:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Anchor className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 dark:text-white truncate">{t("locationGame.title")}</h2>
              </div>

              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-blue-800 dark:text-blue-300">
                    {t("locationGame.guessesRemaining")}: {5 - currentState.guessCount}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {selectedLocation ? "✓ " + t("map.locationSelected") : t("map.clickToSelect")}
                  </span>
                </div>
              </div>

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

              <div className="mb-3 sm:mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{t("locationGame.hints")}:</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {currentState.currentHintIndex + 1}/5
                  </span>
                </div>
                <Progress value={(currentState.currentHintIndex + 1) * 20} className="h-1 mb-2 sm:mb-3" />
                <div className="space-y-1 sm:space-y-2">
                  {[0, 1, 2, 3, 4].map((hintIndex) => {
                    const isVisible = hintIndex <= currentState.currentHintIndex || currentState.isComplete;
                    
                    if (hintIndex === 2) {
                      return (
                        <div
                          key="image-hint"
                          className={`p-1.5 sm:p-2 rounded-md border text-xs sm:text-sm ${
                            isVisible
                              ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
                          }`}
                        >
                          {isVisible ? (
                            currentHarbor?.image_url ? (
                              <div className="space-y-2">
                                <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Harbor Photo:
                                </p>
                                <div className="relative group">
                                  <img
                                    src={currentHarbor.image_url}
                                    alt={`Harbor: ${currentHarbor.name}`}
                                    className="w-full h-32 sm:h-40 object-cover rounded-md border border-slate-200 dark:border-slate-600"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = e.currentTarget.nextElementSibling;
                                      if (fallback) fallback.style.display = 'block';
                                    }}
                                  />
                                  <div 
                                    className="hidden text-xs text-slate-500 dark:text-slate-400"
                                    style={{ display: 'none' }}
                                  >
                                    <p>{currentHarbor?.hints?.[2] || "Additional harbor information"}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p>{currentHarbor?.hints?.[2] || "Additional harbor information"}</p>
                            )
                          ) : (
                            <p>{t("locationGame.hintLocked", { number: 3 })}</p>
                          )}
                        </div>
                      );
                    }
                    
                    const textHintIndex = hintIndex > 2 ? hintIndex - 1 : hintIndex;
                    const hintText = currentHarbor?.hints?.[textHintIndex];
                    
                    return (
                      <div
                        key={`hint-${hintIndex}`}
                        className={`p-1.5 sm:p-2 rounded-md border text-xs sm:text-sm ${
                          isVisible
                            ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
                        }`}
                      >
                        <p>
                          {isVisible && hintText 
                            ? hintText 
                            : t("locationGame.hintLocked", { number: hintIndex + 1 })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {showHarborNames ? <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />}
                    <Label className="text-xs sm:text-sm font-medium">{t("map.showHarborNames")}</Label>
                  </div>
                  <Switch checked={showHarborNames} onCheckedChange={setShowHarborNames} />
                </div>

                <form onSubmit={handleSearch} className="flex gap-1 sm:gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder={t("map.searchHarbor")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 sm:pl-8 text-xs sm:text-sm h-8 sm:h-10"
                    />
                  </div>
                  <Button type="submit" size="sm" variant="secondary" className="px-2 sm:px-3 text-xs sm:text-sm h-8 sm:h-10">
                    {t("common.find")}
                  </Button>
                </form>
              </div>

              {!currentState.isComplete ? (
                <div className="space-y-3 sm:space-y-4">
                  <Button
                    onClick={handleGuess}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base py-3"
                    disabled={!selectedLocation}
                  >
                    <Anchor className="mr-2 h-4 w-4" />
                    {t("locationGame.confirmGuess")} 
                    {currentState.guessCount > 0 && (
                      <span className="ml-2 text-blue-200">
                        ({currentState.guessCount + 1}/5)
                      </span>
                    )}
                  </Button>
                </div>
              ) : gameCompleted ? (
                <Button 
                  onClick={() => setShowFinalResults(true)} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base py-3"
                >
                  {t("locationGame.seeFinalScore")}
                </Button>
              ) : (
                <Button 
                  onClick={nextRound} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base py-3"
                >
                  {round < 3 ? t("locationGame.nextHarbor") : t("locationGame.seeFinalScore")}
                </Button>
              )}

              {currentState.isComplete && currentHarbor && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 lg:p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <h3 className="font-medium text-slate-800 dark:text-white text-sm sm:text-base truncate">{currentHarbor.name}</h3>
                    {currentState.hasCorrectAnswer && (
                      <span className="text-green-600 dark:text-green-400 text-sm flex-shrink-0">✓</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {currentHarbor.description || t("common.noData")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <div className="p-2 sm:p-3 lg:p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-medium text-slate-800 dark:text-white flex items-center justify-between text-sm sm:text-base">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Ship className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  {t("locationGame.mapTitle")}
                </div>
                <span className="text-xs text-slate-500 lg:hidden">
                  {currentState.guessCount + 1}/5
                </span>
              </h3>
            </div>

            <div className="h-[60vh] min-h-[400px] sm:h-[65vh] sm:min-h-[450px] lg:h-[500px]">
              <MapComponent
                selectedLocation={selectedLocation}
                setSelectedLocation={!currentState.isComplete ? setSelectedLocation : null}
                actualLocation={currentState.isComplete && currentHarbor ? currentHarbor.coordinates : null}
                harborName={currentState.isComplete && currentHarbor ? currentHarbor.name : null}
                showFinland={true}
                showHarborNames={showHarborNames}
                harborData={harbors}
                searchedLocation={searchedLocation}
                gameHistory={currentHarbor ? gameHistory.filter(guess => guess.harborId === currentHarbor.id) : []}
                currentHarbor={currentHarbor}
              />
            </div>
          </div>
        </div>

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
          onContinue={() => setShowSuccessModal(false)}
        />
      </div>
    </div>
  )
}