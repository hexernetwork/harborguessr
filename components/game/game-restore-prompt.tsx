// components/game/game-restore-prompt.tsx
"use client"
import { Button } from "@/components/ui/button"
import { RotateCcw, Play } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface GameRestorePromptProps {
  show: boolean
  onRestore: () => void
  onStartNew: () => void  // Changed from onNewGame to onStartNew
}

export default function GameRestorePrompt({
  show,
  onRestore,
  onStartNew  // Changed from onNewGame to onStartNew
}: GameRestorePromptProps) {
  const { t } = useLanguage()
  
  if (!show) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <div className="text-center">
          <RotateCcw className="h-16 w-16 mx-auto text-blue-500 mb-4" />
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
            {t("gameRestore.savedGameFound")}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            {t("gameRestore.savedGameDescription")}
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={onRestore}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("gameRestore.continueGame")}
            </Button>
            <Button 
              onClick={onStartNew}
              variant="outline"
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {t("gameRestore.startNewGame")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}