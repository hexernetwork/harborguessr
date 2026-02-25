// components/hint-panel.tsx
"use client"

import { Anchor } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface HintPanelProps {
  currentRandomHint: string | null
}

export default function HintPanel({ currentRandomHint }: HintPanelProps) {
  const { t } = useLanguage()

  if (!currentRandomHint) return null

  return (
    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Anchor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h3 className="font-medium text-slate-800 dark:text-white">
          {t("locationGame.hint")}
        </h3>
      </div>
      {currentRandomHint.includes("http") ? (
        <img
          src={currentRandomHint}
          alt={t("locationGame.hint")}
          className="w-full h-32 object-cover rounded-md border border-slate-200 dark:border-slate-600"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = ""
            e.currentTarget.alt = currentRandomHint
          }}
        />
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {currentRandomHint}
        </p>
      )}
    </div>
  )
}