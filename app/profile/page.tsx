import type { Metadata } from "next"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { ArrowLeft, Trophy, MapPin, Compass, User, Settings, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Profile | Finnish Harbor Guesser",
  description: "View and manage your Finnish Harbor Guesser profile",
}

// Helper function to get the start of the current week (Monday)
function getStartOfWeek(date: Date) {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(date.setDate(diff))
}

// Helper function to get the end of the current week (Sunday)
function getEndOfWeek(date: Date) {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? 0 : 7) // Adjust when day is Sunday
  return new Date(date.setDate(diff))
}

export default async function ProfilePage() {
  try {
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      redirect("/login")
    }

    const user = session.user

    // Use try/catch for each database query
    let profile = null
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      profile = data
    } catch (error) {
      console.error("Error fetching profile:", error)
    }

    // Default values for stats
    let highestLocationScore = 0
    let highestTriviaScore = 0
    let gamesCount = 0
    let triviaCount = 0

    // Weekly stats
    let weeklyLocationScore = 0
    let weeklyTriviaScore = 0
    let weeklyGamesCount = 0
    let weeklyTriviaCount = 0

    // Get the start and end of the current week
    const now = new Date()
    const startOfWeek = getStartOfWeek(new Date(now))
    const endOfWeek = getEndOfWeek(new Date(now))

    // Format dates for Supabase query
    const startOfWeekStr = startOfWeek.toISOString()
    const endOfWeekStr = endOfWeek.toISOString()

    try {
      const { data: locationStats } = await supabase
        .from("location_game_scores")
        .select("score")
        .eq("user_id", user.id)
        .order("score", { ascending: false })
        .limit(1)

      highestLocationScore = locationStats?.[0]?.score || 0
    } catch (error) {
      console.error("Error fetching location stats:", error)
    }

    try {
      const { data: triviaStats } = await supabase
        .from("trivia_game_scores")
        .select("score")
        .eq("user_id", user.id)
        .order("score", { ascending: false })
        .limit(1)

      highestTriviaScore = triviaStats?.[0]?.score || 0
    } catch (error) {
      console.error("Error fetching trivia stats:", error)
    }

    try {
      const { count } = await supabase
        .from("location_game_scores")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      gamesCount = count || 0
    } catch (error) {
      console.error("Error fetching games count:", error)
    }

    try {
      const { count } = await supabase
        .from("trivia_game_scores")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      triviaCount = count || 0
    } catch (error) {
      console.error("Error fetching trivia count:", error)
    }

    // Weekly stats
    try {
      const { data: weeklyLocationData } = await supabase
        .from("location_game_scores")
        .select("score")
        .eq("user_id", user.id)
        .gte("completed_at", startOfWeekStr)
        .lte("completed_at", endOfWeekStr)
        .order("score", { ascending: false })
        .limit(1)

      weeklyLocationScore = weeklyLocationData?.[0]?.score || 0
    } catch (error) {
      console.error("Error fetching weekly location stats:", error)
    }

    try {
      const { data: weeklyTriviaData } = await supabase
        .from("trivia_game_scores")
        .select("score")
        .eq("user_id", user.id)
        .gte("completed_at", startOfWeekStr)
        .lte("completed_at", endOfWeekStr)
        .order("score", { ascending: false })
        .limit(1)

      weeklyTriviaScore = weeklyTriviaData?.[0]?.score || 0
    } catch (error) {
      console.error("Error fetching weekly trivia stats:", error)
    }

    try {
      const { count } = await supabase
        .from("location_game_scores")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("completed_at", startOfWeekStr)
        .lte("completed_at", endOfWeekStr)

      weeklyGamesCount = count || 0
    } catch (error) {
      console.error("Error fetching weekly games count:", error)
    }

    try {
      const { count } = await supabase
        .from("trivia_game_scores")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("completed_at", startOfWeekStr)
        .lte("completed_at", endOfWeekStr)

      weeklyTriviaCount = count || 0
    } catch (error) {
      console.error("Error fetching weekly trivia count:", error)
    }

    const totalGamesPlayed = gamesCount + triviaCount
    const weeklyGamesPlayed = weeklyGamesCount + weeklyTriviaCount

    // Get initials for avatar
    const getInitials = () => {
      const username = user.user_metadata?.username || user.email || ""
      if (username.includes("@")) {
        return username.substring(0, 2).toUpperCase()
      }
      return username.substring(0, 2).toUpperCase()
    }

    // Format date range for weekly stats
    const formatDateRange = (start: Date, end: Date) => {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3">
                <Card>
                  <CardHeader className="text-center">
                    <Avatar className="w-24 h-24 mx-auto mb-4">
                      <AvatarFallback className="text-3xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle>{profile?.username || user.user_metadata?.username || "User"}</CardTitle>
                    <CardDescription className="truncate">{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Member since</span>
                        <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Games played</span>
                        <span className="font-medium">{totalGamesPlayed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Highest location score</span>
                        <span className="font-medium">{highestLocationScore}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Highest trivia score</span>
                        <span className="font-medium">{highestTriviaScore}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <Link href="/profile/settings">
                        <Button variant="outline" className="w-full flex items-center gap-2 justify-start">
                          <Settings className="h-4 w-4" />
                          Account Settings
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:w-2/3 space-y-6">
                <Tabs defaultValue="all-time">
                  <div className="flex justify-between items-center mb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Game Statistics
                    </CardTitle>
                    <TabsList>
                      <TabsTrigger value="all-time">All Time</TabsTrigger>
                      <TabsTrigger value="weekly">This Week</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="all-time">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              <h3 className="font-medium">Location Game</h3>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Games played</span>
                                <span className="font-medium">{gamesCount}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Highest score</span>
                                <span className="font-medium">{highestLocationScore}</span>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Link href="/location-game">
                                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                  Play Location Game
                                </Button>
                              </Link>
                            </div>
                          </div>

                          <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Compass className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                              <h3 className="font-medium">Trivia Game</h3>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Games played</span>
                                <span className="font-medium">{triviaCount}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Highest score</span>
                                <span className="font-medium">{highestTriviaScore}</span>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Link href="/trivia-game">
                                <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                                  Play Trivia Game
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="weekly">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
                          <Calendar className="h-4 w-4" />
                          <span>Week: {formatDateRange(startOfWeek, endOfWeek)}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              <h3 className="font-medium">Location Game</h3>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Games played</span>
                                <span className="font-medium">{weeklyGamesCount}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Highest score</span>
                                <span className="font-medium">{weeklyLocationScore}</span>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Link href="/location-game">
                                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                  Play Location Game
                                </Button>
                              </Link>
                            </div>
                          </div>

                          <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Compass className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                              <h3 className="font-medium">Trivia Game</h3>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Games played</span>
                                <span className="font-medium">{weeklyTriviaCount}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Highest score</span>
                                <span className="font-medium">{weeklyTriviaScore}</span>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Link href="/trivia-game">
                                <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                                  Play Trivia Game
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {totalGamesPlayed > 0 ? (
                      <div className="space-y-4">
                        {/* We would fetch and display recent activity here */}
                        <p className="text-slate-500 dark:text-slate-400">
                          Your recent game activity will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't played any games yet.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                          <Link href="/location-game">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Play Location Game</Button>
                          </Link>
                          <Link href="/trivia-game">
                            <Button className="bg-teal-600 hover:bg-teal-700 text-white">Play Trivia Game</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    // Fallback UI if Supabase client fails
    console.error("Error in profile page:", error)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Profile Unavailable</h1>
          <p className="mb-6">Unable to load profile information. Please try again later.</p>
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }
}
