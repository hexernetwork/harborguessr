// components/game/nickname-modal.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/contexts/language-context"

interface NicknameModalProps {
  show: boolean
  onSubmit: (nickname: string) => void
  onSkip: () => void
}

export default function NicknameModal({ show, onSubmit, onSkip }: NicknameModalProps) {
  const { t } = useLanguage()
  const [nickname, setNickname] = useState("")

  if (!show) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nickname.trim()) {
      onSubmit(nickname.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">
          {t("leaderboard.nicknamePrompt")}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {t("leaderboard.nicknameDescription")}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder={t("leaderboard.nicknamePlaceholder")}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="w-full"
          />
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!nickname.trim()}
            >
              {t("common.save")}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={onSkip}
              className="flex-1"
            >
              {t("leaderboard.skipLeaderboard")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}