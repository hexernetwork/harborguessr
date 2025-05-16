import Link from "next/link"
import { Compass, Ship, Navigation, Anchor } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Ship className="h-16 w-16 text-blue-600 dark:text-blue-400" />
              <Anchor className="h-8 w-8 text-blue-500 dark:text-blue-300 absolute -bottom-2 -right-2" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 dark:text-white mb-4">Finnish Harbor Guesser</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Navigate the nautical charts to find harbors across Finland
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105">
            <div className="h-48 bg-blue-500 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Navigation className="h-20 w-20 text-white opacity-50" />
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Harbor Location Guesser</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Find Finnish harbors on nautical charts using progressive hints. Each wrong guess reveals a new hint!
              </p>
              <Link href="/location-game">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Play Location Game</Button>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105">
            <div className="h-48 bg-teal-500 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Compass className="h-20 w-20 text-white opacity-50" />
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Harbor Trivia</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Test your knowledge about Finnish harbors with our trivia challenge.
              </p>
              <Link href="/trivia-game">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">Play Trivia Game</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Learn about Finland's maritime heritage while having fun!
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/about">
              <Button variant="outline" className="border-slate-300 dark:border-slate-700">
                About
              </Button>
            </Link>
            <Link href="/how-to-play">
              <Button variant="outline" className="border-slate-300 dark:border-slate-700">
                How to Play
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
