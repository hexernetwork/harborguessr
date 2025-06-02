// app/profile/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trophy, MapPin, Compass, User, Settings, Calendar, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

// Helper function to get the start of the current week (Monday)
function getStartOfWeek(date: Date) {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

// Helper function to get the end of the current week (Sunday)
function getEndOfWeek(date: Date) {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? 0 : 7)
  return new Date(date.setDate(diff))
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [memberSince, setMemberSince] = useState("Unknown")
  const [stats, setStats] = useState({
    highestLocationScore: 0,
    highestTriviaScore: 0,
    gamesCount: 0,
    triviaCount: 0,
    weeklyLocationScore: 0,
    weeklyTriviaScore: 0,
    weeklyGamesCount: 0,
    weeklyTriviaCount: 0
  })

  // Fetch the REAL registration date from auth.users table
  const fetchMemberSince = async (userId: string) => {
    try {
      console.log("Fetching member since date for user:", userId)
      
      // Use Supabase RPC function to get user creation date
      const { data, error } = await supabase.rpc('get_user_created_at', {
        user_id: userId
      })

      if (error) {
        console.error("Error fetching user creation date:", error)
        return "Unknown"
      }

      if (data) {
        console.log("Retrieved creation date:", data)
        const date = new Date(data)
        const formatted = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        })
        console.log("Formatted member since date:", formatted)
        return formatted
      }

      return "Unknown"
    } catch (error) {
      console.error("Error in fetchMemberSince:", error)
      return "Unknown"
    }
  }

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push("/login")
      return
    }

    loadUserData()
  }, [user, authLoading, router])

  const loadUserData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch member since date and stats in parallel
      const [memberSinceDate] = await Promise.all([
        fetchMemberSince(user.id),
        loadStats()
      ])

      setMemberSince(memberSinceDate)

    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return

    try {
      // Get the start and end of the current week
      const now = new Date()
      const startOfWeek = getStartOfWeek(new Date(now))
      const endOfWeek = getEndOfWeek(new Date(now))
      const startOfWeekStr = startOfWeek.toISOString()
      const endOfWeekStr = endOfWeek.toISOString()

      // Fetch all stats in parallel
      const [
        locationHighScore,
        triviaHighScore,
        locationCount,
        triviaCount,
        weeklyLocationScore,
        weeklyTriviaScore,
        weeklyLocationCount,
        weeklyTriviaCount
      ] = await Promise.allSettled([
        // Highest location score
        supabase
          .from("game_scores")
          .select("score")
          .eq("user_id", user.id)
          .eq("game_type", "location")
          .order("score", { ascending: false })
          .limit(1),
        
        // Highest trivia score
        supabase
          .from("game_scores")
          .select("score")
          .eq("user_id", user.id)
          .eq("game_type", "trivia")
          .order("score", { ascending: false })
          .limit(1),
        
        // Location games count
        supabase
          .from("game_scores")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("game_type", "location"),
        
        // Trivia games count
        supabase
          .from("game_scores")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("game_type", "trivia"),
        
        // Weekly location high score
        supabase
          .from("game_scores")
          .select("score")
          .eq("user_id", user.id)
          .eq("game_type", "location")
          .gte("completed_at", startOfWeekStr)
          .lte("completed_at", endOfWeekStr)
          .order("score", { ascending: false })
          .limit(1),
        
        // Weekly trivia high score
        supabase
          .from("game_scores")
          .select("score")
          .eq("user_id", user.id)
          .eq("game_type", "trivia")
          .gte("completed_at", startOfWeekStr)
          .lte("completed_at", endOfWeekStr)
          .order("score", { ascending: false })
          .limit(1),
        
        // Weekly location count
        supabase
          .from("game_scores")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("game_type", "location")
          .gte("completed_at", startOfWeekStr)
          .lte("completed_at", endOfWeekStr),
        
        // Weekly trivia count
        supabase
          .from("game_scores")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("game_type", "trivia")
          .gte("completed_at", startOfWeekStr)
          .lte("completed_at", endOfWeekStr)
      ])

      setStats({
        highestLocationScore: locationHighScore.status === 'fulfilled' ? locationHighScore.value.data?.[0]?.score || 0 : 0,
        highestTriviaScore: triviaHighScore.status === 'fulfilled' ? triviaHighScore.value.data?.[0]?.score || 0 : 0,
        gamesCount: locationCount.status === 'fulfilled' ? locationCount.value.count || 0 : 0,
        triviaCount: triviaCount.status === 'fulfilled' ? triviaCount.value.count || 0 : 0,
        weeklyLocationScore: weeklyLocationScore.status === 'fulfilled' ? weeklyLocationScore.value.data?.[0]?.score || 0 : 0,
        weeklyTriviaScore: weeklyTriviaScore.status === 'fulfilled' ? weeklyTriviaScore.value.data?.[0]?.score || 0 : 0,
        weeklyGamesCount: weeklyLocationCount.status === 'fulfilled' ? weeklyLocationCount.value.count || 0 : 0,
        weeklyTriviaCount: weeklyTriviaCount.status === 'fulfilled' ? weeklyTriviaCount.value.count || 0 : 0
      })

    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const totalGamesPlayed = stats.gamesCount + stats.triviaCount
  const weeklyGamesPlayed = stats.weeklyGamesCount + stats.weeklyTriviaCount

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

  const now = new Date()
  const startOfWeek = getStartOfWeek(new Date(now))
  const endOfWeek = getEndOfWeek(new Date(now))

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
                  <CardTitle>{user.user_metadata?.username || "User"}</CardTitle>
                  <CardDescription className="truncate">{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Member since</span>
                      <span className="font-medium">{memberSince}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Games played</span>
                      <span className="font-medium">{totalGamesPlayed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Highest location score</span>
                      <span className="font-medium">{stats.highestLocationScore}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Highest trivia score</span>
                      <span className="font-medium">{stats.highestTriviaScore}</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Link href="/profile/settings">
                      <Button variant="outline" className="w-full flex items-center gap-2 justify-start">
                        <Settings className="h-4 w-4" />
                        Account Settings
                      </Button>
                    </Link>
                    
                    {/* Admin Dashboard Link - only show for admins */}
                    {user?.user_metadata?.role === 'admin' && (
                      <Link href="/admin">
                        <Button variant="outline" className="w-full flex items-center gap-2 justify-start border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}
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
                              <span className="font-medium">{stats.gamesCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Highest score</span>
                              <span className="font-medium">{stats.highestLocationScore}</span>
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
                              <span className="font-medium">{stats.triviaCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Highest score</span>
                              <span className="font-medium">{stats.highestTriviaScore}</span>
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
                              <span className="font-medium">{stats.weeklyGamesCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Highest score</span>
                              <span className="font-medium">{stats.weeklyLocationScore}</span>
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
                              <span className="font-medium">{stats.weeklyTriviaCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Highest score</span>
                              <span className="font-medium">{stats.weeklyTriviaScore}</span>
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
}