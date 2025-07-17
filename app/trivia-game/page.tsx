// app/trivia-game/page.tsx
import { Suspense } from "react"
import TriviaGameContent from "@/components/trivia-game-content"
import { RefreshCw } from "lucide-react"

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <RefreshCw className="h-10 w-10 mx-auto animate-spin text-teal-600 dark:text-teal-400" />
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading harbor trivia game...</p>
      </div>
    </div>
  )
}

export default function TriviaGamePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TriviaGameContent />
    </Suspense>
  )
}

export const metadata = {
  title: "Harbor Trivia Game | Finnish Harbor Guesser", 
  description: "Test your knowledge about Finnish harbors with our interactive trivia challenge!",
}