// components/game/game-results-modal.tsx

"use client"
import { Button } from "@/components/ui/button"
import { Trophy, Target, Clock, RotateCcw, Home, Award } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"

interface GameResultsModalProps {
  show: boolean
  score: number
  totalQuestions: number
  correctAnswers: number
  gameDuration?: number
  onPlayAgain: () => void
  onReturnHome: () => void
}

export default function GameResultsModal({
  show,
  score,
  totalQuestions,
  correctAnswers,
  gameDuration,
  onPlayAgain,
  onReturnHome
}: GameResultsModalProps) {
  const { t } = useLanguage()
  
  if (!show) return null
  
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const formattedDuration = gameDuration ? Math.floor(gameDuration / 60) + ":" + (gameDuration % 60).toString().padStart(2, '0') : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-2">
        <div className="text-center">
          <Trophy className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-yellow-500 mb-3 sm:mb-4" />
          
          <h2 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white mb-4 sm:mb-6">
            {t("gameResults.gameComplete")}
          </h2>
          
          <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <span className="flex items-center gap-1 sm:gap-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("gameResults.finalScore")}
              </span>
              <span className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">
                {score}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <span className="flex items-center gap-1 sm:gap-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("gameResults.accuracy")}
              </span>
              <span className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">
                {accuracy}%
              </span>
            </div>
            
            {formattedDuration && (
              <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <span className="flex items-center gap-1 sm:gap-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  {t("gameResults.duration")}
                </span>
                <span className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">
                  {formattedDuration}
                </span>
              </div>
            )}
            
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-1">
              {correctAnswers} / {totalQuestions} {t("gameResults.questionsCorrect")}
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {/* Primary action - See Leaderboard */}
            <Link href="/leaderboard" className="block">
              <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 sm:py-3 text-sm sm:text-base">
                <Award className="h-4 w-4 mr-2" />
                {t("gameResults.seeLeaderboard")}
              </Button>
            </Link>
            
            {/* Secondary actions */}
            <div className="flex gap-2 sm:gap-3">
              <Button 
                onClick={onPlayAgain}
                variant="outline"
                className="flex-1 py-2 sm:py-3 text-xs sm:text-sm"
              >
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t("gameResults.playAgain")}</span>
                <span className="sm:hidden">Play Again</span>
              </Button>
              
              <Link href="/" className="flex-1">
                <Button 
                  variant="outline"
                  className="w-full py-2 sm:py-3 text-xs sm:text-sm"
                >
                  <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t("common.returnHome")}</span>
                  <span className="sm:hidden">Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}