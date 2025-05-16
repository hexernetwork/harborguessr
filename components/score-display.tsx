import { Trophy } from "lucide-react"

export default function ScoreDisplay({ score }) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 py-1.5 px-3 rounded-full shadow-sm">
      <Trophy className="h-4 w-4 text-amber-500" />
      <span className="font-medium">{score}</span>
    </div>
  )
}
