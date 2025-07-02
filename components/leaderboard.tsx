// components/leaderboard.tsx

"use client"
import { useState, useEffect } from "react"
import { Trophy, Medal, Award, User, Clock, Target, Percent, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"
import { supabase } from "@/lib/supabase"

interface LeaderboardEntry {
  rank: number
  user_id?: string
  nickname?: string
  display_name: string
  game_type: string
  score: number
  accuracy_percentage?: number
  game_duration_seconds?: number
  completed_at: string
  is_registered: boolean
}

export default function Leaderboard({ showUserStats = false }: { showUserStats?: boolean }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [weeklyTrivia, setWeeklyTrivia] = useState<LeaderboardEntry[]>([])
  const [weeklyLocation, setWeeklyLocation] = useState<LeaderboardEntry[]>([])
  const [allTimeTrivia, setAllTimeTrivia] = useState<LeaderboardEntry[]>([])
  const [allTimeLocation, setAllTimeLocation] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboardData()
  }, [])

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching leaderboard data...")

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      // Fetch all leaderboard entries
      const { data: rawData, error: fetchError } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('language', 'fi')
        .order('score', { ascending: false })
        .order('completed_at', { ascending: false })

      if (fetchError) {
        console.error("Error fetching leaderboard:", fetchError)
        throw fetchError
      }

      console.log("Raw leaderboard data:", rawData)

      // Transform data with proper display names
      const transformData = (data: any[]) => {
        return data?.map((entry, index) => {
          let displayName = 'Anonymous'
          let isRegistered = false

          if (entry.user_id) {
            isRegistered = true
            if (entry.nickname) {
              displayName = entry.nickname
            } else {
              displayName = `User ${entry.user_id.slice(-6)}`
            }
          } else if (entry.nickname) {
            displayName = entry.nickname
            isRegistered = false
          }

          return {
            ...entry,
            rank: index + 1,
            display_name: displayName,
            is_registered: isRegistered
          }
        }) || []
      }

      // Filter and transform data
      const weeklyData = rawData?.filter(entry => 
        new Date(entry.completed_at) >= oneWeekAgo
      ) || []

      setWeeklyTrivia(transformData(weeklyData.filter(entry => entry.game_type === 'trivia')))
      setWeeklyLocation(transformData(weeklyData.filter(entry => entry.game_type === 'location')))
      setAllTimeTrivia(transformData(rawData?.filter(entry => entry.game_type === 'trivia') || []))
      setAllTimeLocation(transformData(rawData?.filter(entry => entry.game_type === 'location') || []))

      console.log("Leaderboard data processed:", {
        weeklyTrivia: weeklyTrivia.length,
        weeklyLocation: weeklyLocation.length,
        allTimeTrivia: allTimeTrivia.length,
        allTimeLocation: allTimeLocation.length
      })

    } catch (err) {
      console.error("Error fetching leaderboard data:", err)
      setError("Failed to load leaderboard data")
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return (
        <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full">
          <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
        </div>
      )
      case 2: return (
        <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full">
          <span className="text-white font-bold text-xs sm:text-sm">2</span>
        </div>
      )
      case 3: return (
        <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full">
          <span className="text-white font-bold text-xs sm:text-sm">3</span>
        </div>
      )
      default: return <span className="text-xs sm:text-sm font-bold text-slate-500">#{rank}</span>
    }
  }

  const LeaderboardTable = ({ data, gameType }: { data: LeaderboardEntry[], gameType: string }) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-6 sm:py-8">
          <Trophy className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-yellow-500 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            {t("leaderboard.noDataYet")}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-2">
            Start playing to see rankings appear here!
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {data.map((entry, index) => (
          <div
            key={`${entry.user_id || entry.nickname}-${index}`}
            className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-colors ${
              entry.rank <= 3 
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-800'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-6 sm:w-8 flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                {entry.is_registered ? (
                  <div className="relative group">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 cursor-help flex-shrink-0" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {t("leaderboard.registered")} {t("common.user")}
                    </div>
                  </div>
                ) : (
                  <span className="h-3 w-3 sm:h-4 sm:w-4 text-center text-gray-400 flex-shrink-0">👤</span>
                )}
                <span className="font-medium text-slate-800 dark:text-white text-sm sm:text-base truncate">
                  {entry.display_name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-shrink-0">
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                <span className="font-bold">{entry.score}</span>
              </div>
              
              {entry.accuracy_percentage !== null && entry.accuracy_percentage !== undefined && (
                <div className="hidden sm:flex items-center gap-1">
                  <Percent className="h-4 w-4 text-green-500" />
                  <span>{Math.round(entry.accuracy_percentage)}%</span>
                </div>
              )}
              
              {entry.game_duration_seconds && (
                <div className="hidden md:flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>{formatDuration(entry.game_duration_seconds)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {t("leaderboard.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">
                {t("common.loading")}...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {t("leaderboard.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button 
                onClick={fetchLeaderboardData}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {t("common.tryAgain")}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="trivia" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger 
            value="trivia"
            className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-200 dark:data-[state=active]:text-slate-900"
          >
            {t("leaderboard.triviaGame")}
          </TabsTrigger>
          <TabsTrigger 
            value="location"
            className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-200 dark:data-[state=active]:text-slate-900"
          >
            {t("leaderboard.locationGame")}
          </TabsTrigger>
        </TabsList>

        {/* Trivia Leaderboards */}
        <TabsContent value="trivia" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Weekly Trivia */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  {t("leaderboard.weeklyTab")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <LeaderboardTable data={weeklyTrivia} gameType="trivia" />
              </CardContent>
            </Card>

            {/* All-Time Trivia */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  {t("leaderboard.allTimeTab")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <LeaderboardTable data={allTimeTrivia} gameType="trivia" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Location Leaderboards */}
        <TabsContent value="location" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Weekly Location */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  {t("leaderboard.weeklyTab")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <LeaderboardTable data={weeklyLocation} gameType="location" />
              </CardContent>
            </Card>

            {/* All-Time Location */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  {t("leaderboard.allTimeTab")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <LeaderboardTable data={allTimeLocation} gameType="location" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}