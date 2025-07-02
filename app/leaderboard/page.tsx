// app/leaderboard/page.tsx
"use client"

import { Suspense } from "react"
import Leaderboard from "@/components/leaderboard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, RefreshCw } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <RefreshCw className="h-10 w-10 mx-auto animate-spin text-yellow-500" />
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading leaderboard...</p>
      </div>
    </div>
  )
}

// Main page content
function LeaderboardContent() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("common.back")}
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                {t("navigation.leaderboard")}
              </h1>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
            {t("leaderboard.description")}
          </p>
        </div>

        {/* Leaderboard Component */}
        <Leaderboard showUserStats={true} />
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LeaderboardContent />
    </Suspense>
  )
}