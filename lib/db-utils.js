// //db-utlis.js
// import { seedDatabase } from "./data"

// // Function to initialize the database with seed data
// export async function initializeDatabase() {
//   // Check if Supabase credentials are available
//   if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
//     console.warn("Supabase credentials not available, skipping database initialization")
//     return { success: false, error: new Error("Supabase credentials not available") }
//   }

//   // Check if we need to seed the database
//   const needsSeeding = typeof window !== "undefined" && localStorage.getItem("dbSeeded") !== "true"

//   if (needsSeeding) {
//     try {
//       const result = await seedDatabase()

//       if (result.success && typeof window !== "undefined") {
//         localStorage.setItem("dbSeeded", "true")
//         console.log("Database seeded successfully")
//       } else {
//         console.warn("Database seeding failed, will try again next time")
//       }

//       return result
//     } catch (error) {
//       console.error("Error initializing database:", error)
//       return { success: false, error }
//     }
//   }

//   return { success: true, alreadySeeded: true }
// }

// // Function to get translations for UI elements
// export function getTranslations(lang = "en") {
//   const translations = {
//     en: {
//       // Navigation
//       backToHome: "Back to Home",
//       about: "About",
//       howToPlay: "How to Play",

//       // Game types
//       locationGame: "Harbor Location Guesser",
//       triviaGame: "Harbor Trivia",
//       playLocationGame: "Play Location Game",
//       playTriviaGame: "Play Trivia Game",

//       // Location game
//       findThisHarbor: "Find this Harbor",
//       hints: "Hints",
//       hintsRevealed: "hints revealed",
//       hintLocked: "Hint {number} - Locked",
//       showHarborNames: "Show Harbor Names",
//       searchHarborPlaceholder: "Search harbor by name...",
//       guessesRemaining: "Guesses remaining",
//       locationSelected: "Location selected",
//       clickMapToSelect: "Click on map to select location",
//       confirmGuess: "Confirm Guess",
//       clickMapInstructions: "Click on the map to select a location, then confirm your guess",
//       nextHarbor: "Next Harbor",
//       seeFinalScore: "See Final Score",

//       // Trivia game
//       loadingTrivia: "Loading trivia questions...",
//       question: "Question",
//       timeLeft: "Time left",
//       nextQuestion: "Next Question",

//       // Feedback messages
//       correct: "Correct!",
//       tryAgain: "Try Again",
//       gameOver: "Game Over",

//       // Map controls
//       standard: "Standard",
//       satellite: "Satellite",
//       terrain: "Terrain",
//     },
//     fi: {
//       // Navigation
//       backToHome: "Takaisin etusivulle",
//       about: "Tietoa",
//       howToPlay: "Kuinka pelata",

//       // Game types
//       locationGame: "Sataman sijainnin arvaus",
//       triviaGame: "Satama-tietovisa",
//       playLocationGame: "Pelaa sijaintipeliä",
//       playTriviaGame: "Pelaa tietovisaa",

//       // Location game
//       findThisHarbor: "Etsi tämä satama",
//       hints: "Vihjeet",
//       hintsRevealed: "vihjettä paljastettu",
//       hintLocked: "Vihje {number} - Lukittu",
//       showHarborNames: "Näytä satamien nimet",
//       searchHarborPlaceholder: "Etsi satamaa nimellä...",
//       guessesRemaining: "Arvauksia jäljellä",
//       locationSelected: "Sijainti valittu",
//       clickMapToSelect: "Klikkaa kartalla valitaksesi sijainnin",
//       confirmGuess: "Vahvista arvaus",
//       clickMapInstructions: "Klikkaa kartalla valitaksesi sijainnin, sitten vahvista arvauksesi",
//       nextHarbor: "Seuraava satama",
//       seeFinalScore: "Katso lopullinen tulos",

//       // Trivia game
//       loadingTrivia: "Ladataan tietovisakysymyksiä...",
//       question: "Kysymys",
//       timeLeft: "Aikaa jäljellä",
//       nextQuestion: "Seuraava kysymys",

//       // Feedback messages
//       correct: "Oikein!",
//       tryAgain: "Yritä uudelleen",
//       gameOver: "Peli päättyi",

//       // Map controls
//       standard: "Standardi",
//       satellite: "Satelliitti",
//       terrain: "Maasto",
//     },
//     sv: {
//       // Navigation
//       backToHome: "Tillbaka till startsidan",
//       about: "Om",
//       howToPlay: "Hur man spelar",

//       // Game types
//       locationGame: "Hamnplatsens gissare",
//       triviaGame: "Hamntrivia",
//       playLocationGame: "Spela platsspelet",
//       playTriviaGame: "Spela triviaspelet",

//       // Location game
//       findThisHarbor: "Hitta denna hamn",
//       hints: "Ledtrådar",
//       hintsRevealed: "ledtrådar avslöjade",
//       hintLocked: "Ledtråd {number} - Låst",
//       showHarborNames: "Visa hamnnamn",
//       searchHarborPlaceholder: "Sök hamn efter namn...",
//       guessesRemaining: "Gissningar kvar",
//       locationSelected: "Plats vald",
//       clickMapToSelect: "Klicka på kartan för att välja plats",
//       confirmGuess: "Bekräfta gissning",
//       clickMapInstructions: "Klicka på kartan för att välja en plats, bekräfta sedan din gissning",
//       nextHarbor: "Nästa hamn",
//       seeFinalScore: "Se slutresultat",

//       // Trivia game
//       loadingTrivia: "Laddar triviafrågor...",
//       question: "Fråga",
//       timeLeft: "Tid kvar",
//       nextQuestion: "Nästa fråga",

//       // Feedback messages
//       correct: "Rätt!",
//       tryAgain: "Försök igen",
//       gameOver: "Spelet är slut",

//       // Map controls
//       standard: "Standard",
//       satellite: "Satellit",
//       terrain: "Terräng",
//     },
//   }

//   return translations[lang] || translations.en
// }
