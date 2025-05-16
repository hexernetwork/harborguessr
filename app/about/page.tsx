import Link from "next/link"
import { ArrowLeft, Ship, MapPin, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Ship className="h-16 w-16 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
              About Finnish Harbor Guesser
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Learn about Finland's maritime heritage through an interactive game
            </p>
          </div>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>The Game</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert">
                <p>
                  Finnish Harbor Guesser is an educational game designed to help players learn about Finland's rich
                  maritime geography, featuring both coastal archipelago harbors and inland lake marinas.
                </p>
                <p>
                  The game features real harbors from across Finland, from the small guest marinas in the archipelago to
                  the inland harbors on Finland's vast lake system. Each harbor has unique characteristics, history, and
                  natural features.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Game Modes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div>
                    <h3 className="text-xl font-medium mb-2 flex items-center gap-2 text-slate-800 dark:text-white">
                      <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Harbor Location Guesser
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Test your geographical knowledge by finding Finnish harbors on a map. You'll receive progressive
                      hints after each wrong guess, with a total of 5 guesses and 5 hints per harbor. The fewer guesses
                      you need, the more points you'll earn!
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium mb-2 flex items-center gap-2 text-slate-800 dark:text-white">
                      <Compass className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      Harbor Trivia
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Put your knowledge to the test with trivia questions about Finnish harbors. Answer quickly to earn
                      more points, but be careful - incorrect answers earn no points! Learn fascinating facts about
                      Finland's maritime infrastructure, history, and significance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Finland's Maritime Geography</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert">
                <p>
                  Finland has a unique maritime geography with both extensive coastlines and a vast inland lake system.
                  The Finnish coastline along the Baltic Sea stretches for approximately 1,100 km, and the country
                  features one of the world's largest archipelagos with thousands of islands.
                </p>
                <p>
                  Finland is also known as "the land of a thousand lakes," although the actual number is much higher -
                  around 188,000 lakes. The largest, Lake Saimaa, is the fourth largest natural freshwater lake in
                  Europe. These inland waterways are connected by canals and rivers, creating an extensive network for
                  boating and navigation.
                </p>
                <p>
                  From the small guest marinas in the outer archipelago to the bustling harbors of coastal cities and
                  the peaceful marinas on inland lakes, Finland offers a diverse range of boating destinations, each
                  with its own unique character and history.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">Ready to test your knowledge of Finnish harbors?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/location-game">
                <Button className="bg-blue-600 hover:bg-blue-700">Play Location Game</Button>
              </Link>
              <Link href="/trivia-game">
                <Button className="bg-teal-600 hover:bg-teal-700">Play Trivia Game</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
