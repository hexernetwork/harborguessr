"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getUserProfile, updateUserProfile } from "@/lib/auth"
import { getUserGameScores, getUserAchievements } from "@/lib/user-progress"
import { getTranslations } from "@/lib/db-utils"
import { getUserLanguage, setUserLanguage } from "@/lib/data"
import { Trophy, Medal, Award, LogOut } from "lucide-react"
import { signOut } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function UserProfile({ userId }) {
  const [profile, setProfile] = useState(null)
  const [scores, setScores] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const translations = getTranslations(getUserLanguage())

  useEffect(() => {
    async function loadUserData() {
      setLoading(true)

      const { profile } = await getUserProfile(userId)
      const { scores } = await getUserGameScores(userId)
      const { achievements } = await getUserAchievements(userId)

      setProfile(profile)
      setScores(scores || [])
      setAchievements(achievements || [])
      setLoading(false)
    }

    loadUserData()
  }, [userId])

  const handleLanguageChange = async (language) => {
    setUserLanguage(language)

    if (profile) {
      await updateUserProfile(userId, { preferred_language: language })
    }

    window.location.reload()
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Calculate stats
  const totalScore = scores.reduce((sum, score) => sum + score.score, 0)
  const locationGames = scores.filter((score) => score.game_type === "location").length
  const triviaGames = scores.filter((score) => score.game_type === "trivia").length
  const totalAchievementPoints = achievements.reduce((sum, a) => sum + a.achievements.points, 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile?.username}</CardTitle>
              <CardDescription>{profile?.full_name}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">{translations.totalScore || "Total Score"}</p>
              <p className="text-2xl font-bold">{totalScore}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">{translations.gamesPlayed || "Games Played"}</p>
              <p className="text-2xl font-bold">{locationGames + triviaGames}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {translations.achievements || "Achievements"}
              </p>
              <p className="text-2xl font-bold">{achievements.length}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {translations.achievementPoints || "Achievement Points"}
              </p>
              <p className="text-2xl font-bold">{totalAchievementPoints}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={profile?.preferred_language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLanguageChange("en")}
              >
                English
              </Button>
              <Button
                variant={profile?.preferred_language === "fi" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLanguageChange("fi")}
              >
                Suomi
              </Button>
              <Button
                variant={profile?.preferred_language === "sv" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLanguageChange("sv")}
              >
                Svenska
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              {translations.signOut || "Sign Out"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="achievements">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="achievements">
            <Trophy className="h-4 w-4 mr-2" />
            {translations.achievements || "Achievements"}
          </TabsTrigger>
          <TabsTrigger value="location">
            <Medal className="h-4 w-4 mr-2" />
            {translations.locationGames || "Location Games"}
          </TabsTrigger>
          <TabsTrigger value="trivia">
            <Award className="h-4 w-4 mr-2" />
            {translations.triviaGames || "Trivia Games"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>{translations.achievements || "Achievements"}</CardTitle>
              <CardDescription>
                {translations.achievementsDescription || "Your unlocked achievements and rewards"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  {translations.noAchievements || "No achievements unlocked yet. Keep playing to earn rewards!"}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-start gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                        <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">{achievement.achievements.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {achievement.achievements.description}
                        </p>
                        <div className="mt-2 flex items-center text-sm">
                          <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                          <span>
                            {achievement.achievements.points} {translations.points || "points"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle>{translations.locationGames || "Location Games"}</CardTitle>
              <CardDescription>
                {translations.locationGamesDescription || "Your harbor location game history"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scores.filter((s) => s.game_type === "location").length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  {translations.noLocationGames || "No location games played yet."}
                </p>
              ) : (
                <div className="space-y-4">
                  {scores
                    .filter((s) => s.game_type === "location")
                    .map((score) => (
                      <div
                        key={score.id}
                        className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium">{translations.locationGame || "Location Game"}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(score.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                          <span className="font-bold">{score.score}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trivia">
          <Card>
            <CardHeader>
              <CardTitle>{translations.triviaGames || "Trivia Games"}</CardTitle>
              <CardDescription>
                {translations.triviaGamesDescription || "Your harbor trivia game history"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scores.filter((s) => s.game_type === "trivia").length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  {translations.noTriviaGames || "No trivia games played yet."}
                </p>
              ) : (
                <div className="space-y-4">
                  {scores
                    .filter((s) => s.game_type === "trivia")
                    .map((score) => (
                      <div
                        key={score.id}
                        className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium">{translations.triviaGame || "Trivia Game"}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(score.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                          <span className="font-bold">{score.score}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
