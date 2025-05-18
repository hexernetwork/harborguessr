"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Ship, Info, Eye, EyeOff, Search, Anchor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { fetchHarborData } from "@/lib/data"
import MapComponent from "@/components/map-component"
import ScoreDisplay from "@/components/score-display"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/contexts/language-context"
import { updateHarborViewCount } from "@/lib/supabase-data"
import { useAuth } from "@/contexts/auth-context"
import { saveHarborGuess, saveLocationGameScore } from "@/lib/data"

export default function LocationGameContent() {
  const { t, language } = useLanguage()
  const [currentHarbor, setCurrentHarbor] = useState(null)
  const [harbors, setHarbors] = useState([])
  const [loading, setLoading] = useState(true)
  const [guessCount, setGuessCount] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [feedback, setFeedback] = useState(null)
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [distance, setDistance] = useState(null)
  const [correctGuess, setCorrectGuess] = useState(false)
  const [showHarborNames, setShowHarborNames] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchedLocation, setSearchedLocation] = useState(null)
  const [showResultPopup, setShowResultPopup] = useState(false)

  const auth = useAuth()
  const user = auth?.user || null

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchHarborData(language)
        if (data && data.length > 0) {
          setHarbors(data)
          selectRandomHarbor(data)
        } else {
          console.error("No harbor data returned")
          setFeedback({
            type: "error",
            message: t("errors.generic"),
          })
        }
      } catch (error) {
        console.error("Error loading harbor data:", error)
        setFeedback({
          type: "error",
          message: t("errors.generic"),
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [language, t])

  const selectRandomHarbor = (harborList) => {
    if (!harborList || harborList.length === 0) {
      console.error("No harbor data available")
      return
    }

    const randomIndex = Math.floor(Math.random() * harborList.length)
    const harbor = harborList[randomIndex]
    setCurrentHarbor(harbor)

    // Update the view count for this harbor
    if (harbor && harbor.id) {
      updateHarborViewCount(harbor.id, language)
        .then(() => console.log(`Updated view count for harbor ${harbor.id}`))
        .catch((error) => console.error("Error updating harbor view count:", error))
    }

    setGuessCount(0)
    setGameOver(false)
    setFeedback(null)
    setCurrentHintIndex(0)
    setCorrectGuess(false)
    setSelectedLocation(null)
    setDistance(null)
  }

  const handleGuess = () => {
    if (!selectedLocation || !currentHarbor || !currentHarbor.coordinates) return

    // Calculate distance between selected point and actual harbor
    const actualLat = currentHarbor.coordinates.lat
    const actualLng = currentHarbor.coordinates.lng
    const selectedLat = selectedLocation.lat
    const selectedLng = selectedLocation.lng

    // Simple distance calculation (in km)
    const R = 6371 // Earth's radius in km
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

    setDistance(Math.round(calculatedDistance))

    // Check if guess is close enough (within 20km)
    const isCorrect = calculatedDistance <= 20
    const newGuessCount = guessCount + 1

    // Calculate score
    let attemptScore = 0
    if (isCorrect) {
      // Calculate score based on number of hints used
      attemptScore = Math.max(100 - guessCount * 20, 20)
      setScore((prevScore) => prevScore + attemptScore)
      setFeedback({
        type: "success",
        message: t("locationGame.correctMessage", { harborName: currentHarbor.name, score: attemptScore }),
      })
      setShowResultPopup(true)
      setCorrectGuess(true)
      setGameOver(true)
    } else {
      setGuessCount(newGuessCount)

      if (newGuessCount >= 5) {
        // Out of guesses
        setFeedback({
          type: "error",
          message: t("locationGame.outOfGuesses", { harborName: currentHarbor.name }),
        })
        setShowResultPopup(true)
        setGameOver(true)
      } else {
        // Show next hint
        setFeedback({
          type: "warning",
          message: t("locationGame.distanceAway", {
            distance: calculatedDistance,
            guessesLeft: 5 - newGuessCount,
          }),
        })
        setShowResultPopup(true)
        setCurrentHintIndex(newGuessCount)
        setSelectedLocation(null) // Clear the selected location for the next guess
      }
    }

    // Save the guess to Supabase if user is logged in
    if (user && currentHarbor.id) {
      try {
        saveHarborGuess(user.id, currentHarbor.id, language, newGuessCount, calculatedDistance, isCorrect, attemptScore)
      } catch (error) {
        console.error("Error saving harbor guess:", error)
      }
    }
  }

  const nextRound = () => {
    if (round < 5) {
      setRound(round + 1)
      selectRandomHarbor(harbors)
    } else {
      // Game over - save final score if user is logged in
      if (user) {
        try {
          saveLocationGameScore(user.id, score, 5, language)
        } catch (error) {
          console.error("Error saving game score:", error)
        }
      }

      // Show final score and restart option
      alert(t("locationGame.finalScore", { score }))
      resetGame()
    }
  }

  const resetGame = () => {
    setRound(1)
    setScore(0)
    selectRandomHarbor(harbors)
  }

  const toggleHarborNames = () => {
    setShowHarborNames(!showHarborNames)
  }

  const handleSearch = (e) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    // Find harbor by name (case insensitive partial match)
    const foundHarbor = harbors.find((harbor) => harbor.name.toLowerCase().includes(searchQuery.toLowerCase()))

    if (foundHarbor) {
      // Set the searched location for the map marker
      setSearchedLocation({
        lat: foundHarbor.coordinates.lat,
        lng: foundHarbor.coordinates.lng,
        name: foundHarbor.name,
      })

      // Also set as selected location to enable the Confirm Guess button
      setSelectedLocation({
        lat: foundHarbor.coordinates.lat,
        lng: foundHarbor.coordinates.lng,
      })

      // Clear search after successful search
      setSearchQuery("")
    } else {
      // Show error message if harbor not found
      setFeedback({
        type: "error",
        message: `${t("common.noResults")}: "${searchQuery}"`,
      })

      // Clear feedback after 3 seconds
      setTimeout(() => {
        setFeedback(null)
      }, 3000)
    }
  }

  const [popupRound, setPopupRound] = useState(round)

  useEffect(() => {
    setPopupRound(round)
  }, [round])

  useEffect(() => {
    setShowResultPopup(false)
  }, [popupRound])

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
              {t("locationGame.round")} {round}/5
            </div>
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
                <Alert
                  className={`mb-4 ${
                    feedback.type === "success"
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900"
                      : feedback.type === "error"
                        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900"
                        : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900"
                  }`}
                >
                  <AlertTitle
                    className={`${
                      feedback.type === "success"
                        ? "text-green-800 dark:text-green-300"
                        : feedback.type === "error"
                          ? "text-red-800 dark:text-red-300"
                          : "text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {feedback.type === "success"
                      ? t("locationGame.correct")
                      : feedback.type === "error"
                        ? t("locationGame.gameOver")
                        : t("locationGame.tryAgain")}
                  </AlertTitle>
                  <AlertDescription
                    className={`${
                      feedback.type === "success"
                        ? "text-green-700 dark:text-green-400"
                        : feedback.type === "error"
                          ? "text-red-700 dark:text-red-400"
                          : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {feedback.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Hints Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t("locationGame.hints")}:</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {currentHintIndex + 1}/5 {t("locationGame.hintsRevealed")}
                  </span>
                </div>
                <Progress value={(currentHintIndex + 1) * 20} className="h-1 mb-3" />
                <div className="space-y-2">
                  {currentHarbor && currentHarbor.hints && currentHarbor.hints.length > 0 ? (
                    currentHarbor.hints.map((hint, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-md border ${
                          index <= currentHintIndex || gameOver
                            ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600"
                        }`}
                      >
                        {index <= currentHintIndex || gameOver ? (
                          <p className="text-sm">{hint}</p>
                        ) : (
                          <p className="text-sm">{t("locationGame.hintLocked", { number: index + 1 })}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 rounded-md border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <p className="text-sm">{t("locationGame.noHints")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Map Controls */}
              <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {showHarborNames ? (
                      <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    )}
                    <Label htmlFor="harbor-names" className="text-sm font-medium">
                      {t("locationGame.showHarborNames")}
                    </Label>
                  </div>
                  <Switch id="harbor-names" checked={showHarborNames} onCheckedChange={toggleHarborNames} />
                </div>

                {/* Harbor Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder={t("locationGame.searchHarbor")}
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

              {!gameOver ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("locationGame.guessesRemaining")}: {5 - guessCount}
                    </p>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {selectedLocation ? t("locationGame.locationSelected") : t("locationGame.clickToSelect")}
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
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <Info className="h-3 w-3" />
                    <p>{t("locationGame.clickMapTip")}</p>
                  </div>
                </div>
              ) : (
                <Button onClick={nextRound} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                  {round < 5 ? t("locationGame.nextHarbor") : t("locationGame.seeFinalScore")}
                </Button>
              )}

              {gameOver && currentHarbor && (
                <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <h3 className="font-medium text-slate-800 dark:text-white mb-2">{currentHarbor.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {currentHarbor.description || t("common.noData")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentHarbor.type && currentHarbor.type.map ? (
                      currentHarbor.type.map((type, index) => (
                        <div
                          key={index}
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs py-1 px-2 rounded-full"
                        >
                          {type}
                        </div>
                      ))
                    ) : (
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs py-1 px-2 rounded-full">
                        Harbor
                      </div>
                    )}
                  </div>
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
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("locationGame.mapDescription")}</p>
            </div>

            <MapComponent
              selectedLocation={selectedLocation}
              setSelectedLocation={!gameOver ? setSelectedLocation : null}
              actualLocation={gameOver && currentHarbor ? currentHarbor.coordinates : null}
              harborName={gameOver && currentHarbor ? currentHarbor.name : null}
              showFinland={true}
              showHarborNames={showHarborNames}
              harborData={harbors}
              searchedLocation={searchedLocation}
            />
          </div>
        </div>
        {/* Result Popup for Mobile */}
        {showResultPopup && feedback && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:hidden">
            <div
              className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-sm w-full p-4 ${
                feedback.type === "success"
                  ? "border-l-4 border-green-500"
                  : feedback.type === "error"
                    ? "border-l-4 border-red-500"
                    : "border-l-4 border-amber-500"
              }`}
            >
              <div className="flex items-start mb-4">
                <div
                  className={`rounded-full p-2 mr-3 ${
                    feedback.type === "success"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : feedback.type === "error"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  ) : feedback.type === "error" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                    {feedback.type === "success"
                      ? t("locationGame.correct")
                      : feedback.type === "error"
                        ? t("locationGame.gameOver")
                        : t("locationGame.tryAgain")}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{feedback.message}</p>
                  {distance && feedback.type !== "success" && (
                    <p className="text-slate-600 dark:text-slate-300 mt-2 font-medium">
                      {t("locationGame.distanceAway", { distance, guessesLeft: 5 - guessCount })}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setShowResultPopup(false)}
                className={`w-full ${
                  feedback.type === "success"
                    ? "bg-green-600 hover:bg-green-700"
                    : feedback.type === "error"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-amber-600 hover:bg-amber-700"
                } text-white`}
              >
                {t("common.ok")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
