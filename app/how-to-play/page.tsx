import Link from "next/link"
import { ArrowLeft, HelpCircle, MapPin, Target, Trophy, Compass, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HowToPlay() {
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
            <HelpCircle className="h-16 w-16 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">How to Play</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Learn the rules and strategies for Finnish Harbor Guesser
            </p>
          </div>

          <Tabs defaultValue="location">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="location">Location Game</TabsTrigger>
              <TabsTrigger value="trivia">Trivia Game</TabsTrigger>
            </TabsList>

            <TabsContent value="location">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Harbor Location Game Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose dark:prose-invert">
                    <p>
                      In the Harbor Location Game, your goal is to find Finnish harbors on a map. The game consists of 5
                      rounds, with a different harbor to locate in each round.
                    </p>

                    <h3>How to Play:</h3>
                    <ol>
                      <li>You'll be given a harbor to locate, initially with just one hint.</li>
                      <li>Click on the map where you think the harbor is located.</li>
                      <li>Click "Confirm Guess" to submit your guess.</li>
                      <li>If your guess is wrong (more than 20km away), you'll receive another hint.</li>
                      <li>You have a total of 5 guesses for each harbor.</li>
                      <li>Each wrong guess reveals a new hint to help you.</li>
                      <li>The fewer guesses you need, the more points you earn.</li>
                      <li>After 5 rounds, your total score will be displayed.</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Scoring System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-slate-600 dark:text-slate-300">
                        Your score for each round is calculated based on how many guesses you needed:
                      </p>

                      <div className="grid gap-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 mt-0.5">
                            <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-white">First guess correct</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              If you find the harbor on your first try, you earn 100 points.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-2 mt-0.5">
                            <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-white">Hint Penalty</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Each wrong guess (which reveals a hint) reduces your potential score by 20 points.
                              <br />
                              1st guess: 100 points
                              <br />
                              2nd guess: 80 points
                              <br />
                              3rd guess: 60 points
                              <br />
                              4th guess: 40 points
                              <br />
                              5th guess: 20 points
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Tips & Strategies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                        <span>
                          Pay close attention to the region mentioned in the hints - this can narrow down your options
                          significantly.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                        <span>
                          Learn about Finland's geography: the archipelago in the southwest, the large lakes in the
                          interior, and the northern regions.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                        <span>Use the city markers on the map as reference points to help you locate regions.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                        <span>
                          Look for distinctive features in the hints - some harbors are on islands, others on lakes,
                          etc.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                        <span>
                          Remember that a correct guess is within 20km of the actual location - you don't need to be
                          exact.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trivia">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Compass className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      Trivia Game Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose dark:prose-invert">
                    <p>
                      In the Trivia Game, you'll answer questions about Finnish harbors, testing your knowledge of their
                      history, features, and significance.
                    </p>

                    <h3>How to Play:</h3>
                    <ol>
                      <li>You'll be presented with a multiple-choice question about Finnish harbors.</li>
                      <li>You have 15 seconds to select the correct answer from four options.</li>
                      <li>
                        After answering (or when time runs out), you'll see the correct answer and an explanation.
                      </li>
                      <li>Points are awarded for correct answers, with bonus points for quick responses.</li>
                      <li>The game consists of 10 questions in total.</li>
                      <li>After all questions, your final score will be displayed.</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      Scoring System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-slate-600 dark:text-slate-300">
                        Your score for each question is calculated based on:
                      </p>

                      <div className="grid gap-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-teal-100 dark:bg-teal-900 rounded-full p-2 mt-0.5">
                            <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-white">Correct Answer</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Each correct answer earns a base of 50 points. Incorrect answers earn 0 points.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-2 mt-0.5">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-white">Time Bonus</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              The faster you answer, the more bonus points you earn. Answering immediately can earn up
                              to 50 additional points.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      Tips & Strategies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                        <span>Read the question carefully before looking at the answer options.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                        <span>
                          Balance speed with accuracy - it's better to take an extra second to be sure than to guess
                          wrong.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                        <span>Pay attention to the explanations after each question to learn for future rounds.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                        <span>
                          Learn about the different types of harbors: archipelago marinas, inland lake harbors, coastal
                          ports, etc.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                        <span>
                          Familiarize yourself with the geography of Finland to better understand the locations
                          mentioned in the questions.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-10 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">Ready to put your knowledge to the test?</p>
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
