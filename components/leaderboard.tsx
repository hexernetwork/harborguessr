// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { getLeaderboard } from "@/lib/user-progress"
// import { getTranslations } from "@/lib/db-utils"
// import { getUserLanguage } from "@/lib/data"
// import { Trophy, MapPin, Compass } from "lucide-react"

// export default function Leaderboard() {
//   const [locationLeaderboard, setLocationLeaderboard] = useState([])
//   const [triviaLeaderboard, setTriviaLeaderboard] = useState([])
//   const [loading, setLoading] = useState(true)
//   const translations = getTranslations(getUserLanguage())

//   useEffect(() => {
//     async function loadLeaderboards() {
//       setLoading(true)

//       const { leaderboard: locationData } = await getLeaderboard("location", 10)
//       const { leaderboard: triviaData } = await getLeaderboard("trivia", 10)

//       setLocationLeaderboard(locationData || [])
//       setTriviaLeaderboard(triviaData || [])
//       setLoading(false)
//     }

//     loadLeaderboards()
//   }, [])

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-[400px]">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     )
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Trophy className="h-5 w-5 text-amber-500" />
//           {translations.leaderboard || "Leaderboard"}
//         </CardTitle>
//         <CardDescription>{translations.leaderboardDescription || "Top players and their scores"}</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <Tabs defaultValue="location">
//           <TabsList className="grid grid-cols-2 mb-6">
//             <TabsTrigger value="location">
//               <MapPin className="h-4 w-4 mr-2" />
//               {translations.locationGame || "Location Game"}
//             </TabsTrigger>
//             <TabsTrigger value="trivia">
//               <Compass className="h-4 w-4 mr-2" />
//               {translations.triviaGame || "Trivia Game"}
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="location">
//             {locationLeaderboard.length === 0 ? (
//               <p className="text-center py-8 text-slate-500">
//                 {translations.noLeaderboardData || "No leaderboard data available yet."}
//               </p>
//             ) : (
//               <div className="space-y-4">
//                 {locationLeaderboard.map((entry, index) => (
//                   <div key={entry.id} className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
//                     <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold">
//                       {index + 1}
//                     </div>
//                     <Avatar className="h-10 w-10">
//                       <AvatarImage src={entry.profiles?.avatar_url || "/placeholder.svg"} />
//                       <AvatarFallback>{entry.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback>
//                     </Avatar>
//                     <div className="flex-1">
//                       <p className="font-medium">{entry.profiles?.username}</p>
//                       <p className="text-sm text-slate-500 dark:text-slate-400">
//                         {new Date(entry.completed_at).toLocaleDateString()}
//                       </p>
//                     </div>
//                     <div className="flex items-center">
//                       <Trophy className="h-5 w-5 text-amber-500 mr-2" />
//                       <span className="font-bold">{entry.score}</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </TabsContent>

//           <TabsContent value="trivia">
//             {triviaLeaderboard.length === 0 ? (
//               <p className="text-center py-8 text-slate-500">
//                 {translations.noLeaderboardData || "No leaderboard data available yet."}
//               </p>
//             ) : (
//               <div className="space-y-4">
//                 {triviaLeaderboard.map((entry, index) => (
//                   <div key={entry.id} className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
//                     <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 font-bold">
//                       {index + 1}
//                     </div>
//                     <Avatar className="h-10 w-10">
//                       <AvatarImage src={entry.profiles?.avatar_url || "/placeholder.svg"} />
//                       <AvatarFallback>{entry.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback>
//                     </Avatar>
//                     <div className="flex-1">
//                       <p className="font-medium">{entry.profiles?.username}</p>
//                       <p className="text-sm text-slate-500 dark:text-slate-400">
//                         {new Date(entry.completed_at).toLocaleDateString()}
//                       </p>
//                     </div>
//                     <div className="flex items-center">
//                       <Trophy className="h-5 w-5 text-amber-500 mr-2" />
//                       <span className="font-bold">{entry.score}</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </TabsContent>
//         </Tabs>
//       </CardContent>
//     </Card>
//   )
// }
