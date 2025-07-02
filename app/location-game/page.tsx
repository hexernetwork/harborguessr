// app/location-game/page.tsx
import { Suspense } from "react"
import LocationGameContent from "@/components/location-game-content"
import { RefreshCw } from "lucide-react"

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <RefreshCw className="h-10 w-10 mx-auto animate-spin text-blue-600 dark:text-blue-400" />
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading harbor location game...</p>
      </div>
    </div>
  )
}

export default function LocationGamePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LocationGameContent />
    </Suspense>
  )
}

export const metadata = {
  title: "Harbor Location Game | Finnish Harbor Guesser",
  description: "Find Finnish harbors on nautical charts using progressive hints. Test your geographical knowledge!",
}