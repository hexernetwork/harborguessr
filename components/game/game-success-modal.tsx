// components/game/game-success-modal.tsx
"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface GameSuccessModalProps {
  show: boolean
  message: string
  score?: number
  onContinue: () => void
}

export default function GameSuccessModal({
  show,
  message,
  score,
  onContinue
}: GameSuccessModalProps) {
  const { t } = useLanguage()

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
            {t("gameSuccess.correct")}
          </h2>

          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {message}
          </p>

          {score !== undefined && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-bold text-lg text-slate-800 dark:text-white">
                +{score} {t("gameSuccess.points")}
              </span>
            </div>
          )}

          <Button 
            onClick={onContinue}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {t("common.continue")}
          </Button>
        </div>
      </div>
    </div>
  )
}