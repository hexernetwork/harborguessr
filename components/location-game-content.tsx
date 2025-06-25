// components/location-game-content.tsx
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

// Fetch harbors from cached worker API
async function fetchHarborsFromWorker(language) {
  try {
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL
    
    if (!workerUrl) {
      throw new Error('NEXT_PUBLIC_WORKER_URL environment variable is not set')
    }
    
    console.log(`🎯 Fetching harbors from worker cache: ${workerUrl}/harbors?lang=${language}`)
    
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
    console.log(`✅ Fetched ${data.length} harbors from worker cache (${response.headers.get('X-Cache') || 'UNKNOWN'})`)
    
    return data
  } catch (error) {
    console.error('❌ Error fetching harbors from worker:', error)
    
    // Fallback to direct Supabase query if worker fails
    console.log('🔄 Falling back to direct Supabase query...')
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
  
  // Simple game state
  const [gameStarted, setGameStarted] = useState(false)
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  const [gameHistory, setGameHistory] = useState([]) // All guesses
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false) // Track if game is fully completed
  const [showFinalResults, setShowFinalResults] = useState(false) // Show final results modal

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
    const currentHintIndex = Math.min(guessCount, 4) // 0-4 for 5 hints
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
      gameCompleted
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
      const savedGame = loadGameState()
      console.log("Checking for saved game:", savedGame)
      
      // SIMPLIFIED: Only restore if there are actual guesses made (ignore language mismatch)
      if (savedGame && savedGame.gameStarted && savedGame.gameHistory && savedGame.gameHistory.length > 0) {
        console.log("Found saved game with guesses, showing restore prompt")
        setShowRestorePrompt(true)
        setLoading(false)
        return
      }
      
      // Otherwise always start fresh
      console.log("Starting fresh game")
      clearGameState() // Clear any stale data
      await loadGameData()
      
    } catch (error) {
      console.error("Error initializing game:", error)
      setLoading(false)
    }
  }

  const loadGameData = async (savedGame = null) => {
    try {
      let data = loadCachedHarborData(language)
      
      if (!data) {
        data = await fetchHarborsFromWorker(language)
        if (data && data.length > 0) {
          saveHarborData(data, language)
        }
      }
      
      if (data && data.length > 0) {
        const correctLanguageHarbors = data.filter(harbor => harbor.language === language)
        const finalHarbors = correctLanguageHarbors.length > 0 ? correctLanguageHarbors : data
        
        setHarbors(finalHarbors)
        
        // Only restore if explicitly passed a saved game
        if (savedGame && savedGame.currentHarbor) {
          console.log("Restoring saved game...")
          restoreGameState(savedGame)
        } else {
          console.log("Starting fresh game...")
          selectRandomHarbor(finalHarbors)
          setGameStarted(true)
        }
      }
    } catch (error) {
      console.error("Error loading game data:", error)
      setFeedback({ type: "error", message: t("errors.generic") })
    } finally {
      setLoading(false)
    }
  }

  const restoreGameState = (savedGame) => {
    console.log("Restoring game state:", savedGame)
    
    setCurrentHarbor(savedGame.currentHarbor)
    setHarbors(savedGame.harbors || [])
    setScore(savedGame.score || 0)
    setRound(savedGame.round || 1)
    setSessionId(savedGame.sessionId || sessionId)
    setGameHistory(savedGame.gameHistory || [])
    setGameStarted(true)
    setGameCompleted(savedGame.gameCompleted || false)
    
    console.log("Restored game history:", savedGame.gameHistory?.length || 0, "guesses")
    console.log("Language change:", savedGame.language, "→", language)
    
    // Check if game was already completed
    if (savedGame.gameCompleted) {
      setFeedback({
        type: "info",
        message: t("locationGame.finalScore", { score: savedGame.score || 0 })
      })
      return
    }
    
    // Check if current harbor is complete and set appropriate feedback
    if (savedGame.currentHarbor && savedGame.gameHistory) {
      const currentGuesses = savedGame.gameHistory.filter(guess => guess.harborId === savedGame.currentHarbor.id)
      const hasCorrectAnswer = currentGuesses.some(guess => guess.correct)
      
      if (hasCorrectAnswer) {
        const correctGuess = currentGuesses.find(g => g.correct)
        setFeedback({
          type: "success",
          message: t("locationGame.correctMessage", { 
            harborName: savedGame.currentHarbor.name, 
            score: correctGuess?.score || 0
          })
        })
      } else if (currentGuesses.length >= 5) {
        setFeedback({
          type: "error",
          message: t("locationGame.outOfGuesses", { harborName: savedGame.currentHarbor.name })
        })
      } else if (currentGuesses.length > 0) {
        // Show info about previous attempts to help user understand what happened
        setFeedback({
          type: "info",
          message: `${language === 'fi' ? 'Peli palautettu' : 'Game restored'} - ${currentGuesses.length} ${language === 'fi' ? 'yritystä tehty' : 'attempts made'}`
        })
      }
    }
  }

  const restoreSavedGame = () => {
    const savedGame = loadGameState()
    console.log("Restoring saved game:", savedGame)
    if (savedGame) {
      loadGameData(savedGame) // Pass saved game to loadGameData
    }
    setShowRestorePrompt(false)
  }

  const startNewGame = () => {
    console.log("Starting new game, clearing localStorage")
    clearGameState()
    setShowRestorePrompt(false)
    setGameHistory([])
    setGameCompleted(false)
    loadGameData() // Start fresh without saved game
  }

  const selectRandomHarbor = (harborList) => {
    if (!harborList || harborList.length === 0) return

    const randomIndex = Math.floor(Math.random() * harborList.length)
    const harbor = harborList[randomIndex]
    
    setCurrentHarbor(harbor)
    setSelectedLocation(null)
    setFeedback(null)

    console.log(`Selected harbor: ${harbor.name} (ID: ${harbor.id})`)
    
    // Save immediately when harbor is selected (for round progression)
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
        gameCompleted
      }
      saveGameState(immediateGameState)
      console.log("IMMEDIATE save after harbor selection - Round:", round, "Harbor:", harbor.name)
    }
  }

  const handleGuess = async () => {
    if (!selectedLocation || !currentHarbor) return

    const state = getCurrentHarborState()
    if (state.isComplete) return // Already complete

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

    // Anti-cheat: Check if this harbor has already been correctly guessed before
    const previousCorrectGuess = gameHistory.find(guess => 
      guess.harborId === currentHarbor.id && guess.correct
    )

    // Calculate score - no points if already correctly guessed this harbor before
    let attemptScore = 0
    if (isCorrect && !previousCorrectGuess) {
      attemptScore = Math.max(100 - (newGuessCount - 1) * 20, 20)
      setScore(prevScore => prevScore + attemptScore)
    }

    // Create guess record
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

    // Add to game history
    const newHistory = [...gameHistory, guessRecord]
    setGameHistory(newHistory)
    console.log("Added guess to history. Total guesses:", newHistory.length)
    
    // Save state IMMEDIATELY with the new guess (before any other state updates)
    const immediateGameState = {
      currentHarbor,
      harbors,
      score: score + attemptScore, // Include the new score immediately
      round,
      gameStarted,
      sessionId,
      language,
      gameHistory: newHistory, // Use the new history immediately
      gameCompleted
    }
    saveGameState(immediateGameState)
    console.log("IMMEDIATE save after guess - Round:", round, "Harbor:", currentHarbor.name, "Guesses:", newHistory.length)
    
    // Set feedback based on result
    if (isCorrect) {
      if (previousCorrectGuess) {
        setFeedback({
          type: "warning",
          message: `${t("locationGame.correctMessage", { harborName: currentHarbor.name, score: 0 })} (${language === 'fi' ? 'Ei pisteitä - jo ratkaistu aiemmin' : 'No points - already solved previously'})`
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

  // Save complete game to Supabase - only called once when game finishes
  const saveCompleteGameToSupabase = async () => {
    if (gameCompleted) {
      console.log("Game already completed and saved, skipping duplicate save")
      return
    }

    try {
      console.log("Saving complete game to Supabase...")
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      // Calculate total correct guesses
      const correctGuesses = gameHistory.filter(guess => guess.correct).length
      
      await saveLocationGameScore(
        currentUser?.id || null,
        score,
        correctGuesses,
        language,
        currentUser?.id ? null : sessionId
      )
      
      // Mark game as completed to prevent duplicate saves
      setGameCompleted(true)
      
      // Clear the saved game state since it's now complete
      clearGameState()
      
      console.log("Game successfully saved to Supabase")
    } catch (error) {
      console.error("Error saving complete game:", error)
    }
  }

  const nextRound = async () => {
    if (round < 3) {
      const newRound = round + 1
      setRound(newRound)
      selectRandomHarbor(harbors)
      
      // Save the round progression immediately after state updates
      setTimeout(() => {
        saveCurrentGameState()
      }, 100)
      
    } else {
      // Game completed - save to Supabase and show results
      await saveCompleteGameToSupabase()
      setShowFinalResults(true)
      setFeedback(null)
    }
  }

  const resetGame = () => {
    clearGameState()
    setRound(1)
    setScore(0)
    setGameHistory([])
    setGameCompleted(false)
    setShowFinalResults(false)
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
        type: "error",
        message: `${t("common.noResults")}: "${searchQuery}"`
      })
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  // Show restore prompt
  if (showRestorePrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
              {language === 'fi' ? 'Löydettiin tallennettu peli' : 'Saved Game Found'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {language === 'fi' 
                ? 'Haluatko jatkaa keskenjäänyttä peliä vai aloittaa uuden?' 
                : 'Would you like to continue your saved game or start fresh?'}
            </p>
            <div className="space-y-3">
              <Button onClick={restoreSavedGame} className="w-full bg-blue-600 hover:bg-blue-700">
                {language === 'fi' ? 'Jatka peliä' : 'Continue Game'}
              </Button>
              <Button onClick={startNewGame} variant="outline" className="w-full">
                {language === 'fi' ? 'Aloita uusi peli' : 'Start New Game'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 mx-auto animate-spin text-blue-600 dark:text-blue-400" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  // Get current state for display
  const currentState = getCurrentHarborState()

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
            <div className="bg-blue-600 text-white text-xs font-medium py-1.5 px-3 rounded-full shadow-md">
              {t("locationGame.round")} {round}/3
            </div>
            <Button onClick={resetGame} variant="outline" size="sm" className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              {language === 'fi' ? 'Uusi peli' : 'Reset'}
            </Button>
            <ScoreDisplay score={score} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Anchor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t("locationGame.title")}</h2>
              </div>

              {feedback && (
                <Alert className={`mb-4 ${
                  feedback.type === "success" ? "bg-green-50 border-green-200 dark:bg-green-900/20" :
                  feedback.type === "error" ? "bg-red-50 border-red-200 dark:bg-red-900/20" :
                  "bg-amber-50 border-amber-200 dark:bg-amber-900/20"
                }`}>
                  <AlertTitle className={
                    feedback.type === "success" ? "text-green-800 dark:text-green-300" :
                    feedback.type === "error" ? "text-red-800 dark:text-red-300" :
                    "text-amber-800 dark:text-amber-300"
                  }>
                    {feedback.type === "success" ? t("locationGame.correct") :
                     feedback.type === "error" ? t("locationGame.gameOver") :
                     t("locationGame.tryAgain")}
                  </AlertTitle>
                  <AlertDescription className={
                    feedback.type === "success" ? "text-green-700 dark:text-green-400" :
                    feedback.type === "error" ? "text-red-700 dark:text-red-400" :
                    "text-amber-700 dark:text-amber-400"
                  }>
                    {feedback.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Hints */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t("locationGame.hints")}:</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {currentState.currentHintIndex + 1}/5 {t("locationGame.hintsRevealed")}
                  </span>
                </div>
                <Progress value={(currentState.currentHintIndex + 1) * 20} className="h-1 mb-3" />
                <div className="space-y-2">
                  {currentHarbor?.hints?.map((hint, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-md border ${
                        index <= currentState.currentHintIndex || currentState.isComplete
                          ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
                      }`}
                    >
                      <p className="text-sm">
                        {index <= currentState.currentHintIndex || currentState.isComplete 
                          ? hint 
                          : t("locationGame.hintLocked", { number: index + 1 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {showHarborNames ? <Eye className="h-4 w-4 text-blue-600" /> : <EyeOff className="h-4 w-4 text-slate-500" />}
                    <Label className="text-sm font-medium">{t("map.showHarborNames")}</Label>
                  </div>
                  <Switch checked={showHarborNames} onCheckedChange={setShowHarborNames} />
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder={t("map.searchHarbor")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button type="submit" size="sm" variant="secondary">
                    {t("common.find")}
                  </Button>
                </form>
              </div>

              {/* Game Actions */}
              {!currentState.isComplete ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("locationGame.guessesRemaining")}: {5 - currentState.guessCount}
                    </p>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {selectedLocation ? t("map.locationSelected") : t("map.clickToSelect")}
                    </div>
                  </div>
                  <Button
                    onClick={handleGuess}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!selectedLocation}
                  >
                    <Anchor className="mr-2 h-4 w-4" />
                    {t("locationGame.confirmGuess")}
                  </Button>
                </div>
              ) : gameCompleted ? (
                <Button 
                  onClick={() => setShowFinalResults(true)} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {t("locationGame.seeFinalResults")}
                </Button>
              ) : (
                <Button 
                  onClick={nextRound} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {round < 3 ? t("locationGame.nextHarbor") : t("locationGame.seeFinalScore")}
                </Button>
              )}

              {/* Harbor Info when complete */}
              {currentState.isComplete && currentHarbor && (
                <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-slate-800 dark:text-white">{currentHarbor.name}</h3>
                    {currentState.hasCorrectAnswer && (
                      <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {currentHarbor.description || t("common.noData")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                <Ship className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {t("locationGame.mapTitle")}
              </h3>
            </div>

            <MapComponent
              selectedLocation={selectedLocation}
              setSelectedLocation={!currentState.isComplete ? setSelectedLocation : null}
              actualLocation={currentState.isComplete && currentHarbor ? currentHarbor.coordinates : null}
              harborName={currentState.isComplete && currentHarbor ? currentHarbor.name : null}
              showFinland={true}
              showHarborNames={showHarborNames}
              harborData={harbors}
              searchedLocation={searchedLocation}
              gameHistory={currentHarbor ? gameHistory.filter(guess => guess.harborId === currentHarbor.id) : []} // Always show current harbor's guesses
              currentHarbor={currentHarbor}
            />
          </div>
        </div>

        {/* Final Results Modal */}
        {showFinalResults && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                  {language === 'fi' ? 'Peli valmis!' : 'Game Complete!'}
                </h2>
                
                <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                  {score}
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                  {language === 'fi' ? 'Loppupisteesi' : 'Final Score'}
                </p>

                {/* Game Statistics */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {language === 'fi' ? 'Oikeat vastaukset' : 'Correct Guesses'}
                      </div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {gameHistory.filter((guess, index) => 
                          guess.correct && gameHistory.findIndex(g => g.harborId === guess.harborId && g.correct) === index
                        ).length}/3
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {language === 'fi' ? 'Yhteensä yrityksiä' : 'Total Attempts'}
                      </div>
                      <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                        {gameHistory.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Message */}
                <div className="mb-6">
                  {score >= 240 ? (
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      {language === 'fi' ? '🎉 Loistava suoritus!' : '🎉 Excellent performance!'}
                    </p>
                  ) : score >= 180 ? (
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {language === 'fi' ? '👍 Hyvä työ!' : '👍 Good job!'}
                    </p>
                  ) : score >= 120 ? (
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      {language === 'fi' ? '👌 Ei hassumpi!' : '👌 Not bad!'}
                    </p>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      {language === 'fi' ? '🎯 Harjoitus tekee mestarin!' : '🎯 Practice makes perfect!'}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={resetGame}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {language === 'fi' ? 'Pelaa uudelleen' : 'Play Again'}
                  </Button>
                  <Button
                    onClick={() => setShowFinalResults(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    {language === 'fi' ? 'Sulje' : 'Close'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  {t("locationGame.correct")}!
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {feedback?.message}
                </p>
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {t("common.continue")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}