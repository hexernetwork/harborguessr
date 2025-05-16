import { createClient } from "@supabase/supabase-js"
import { harbors as enHarbors } from "./endata.js"
import { harbors as fiHarbors } from "./findata.js"
import { harbors as svHarbors } from "./swedata.js"
import { triviaQuestions as enTrivia } from "./entrivia.js"
import { triviaQuestions as fiTrivia } from "./fintrivia.js"
import { triviaQuestions as svTrivia } from "./swetrivia.js"
import {
  fetchHarborData as fetchSupabaseHarborData,
  fetchHarborTrivia as fetchSupabaseHarborTrivia,
  fetchRandomHarbor as fetchSupabaseRandomHarbor,
  fetchRandomTriviaQuestions as fetchSupabaseRandomTriviaQuestions,
  incrementHarborViewCount,
  incrementTriviaViewCount,
} from "./supabase-data.js"

// Initialize Supabase client if environment variables are available
let supabase = null
try {
  if (
    typeof window !== "undefined" &&
    window.ENV &&
    window.ENV.NEXT_PUBLIC_SUPABASE_URL &&
    window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    supabase = createClient(window.ENV.NEXT_PUBLIC_SUPABASE_URL, window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log("Supabase client initialized with window.ENV")
  } else if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log("Supabase client initialized with process.env")
  } else {
    console.log("Supabase environment variables not found, using local data")
  }
} catch (error) {
  console.error("Error initializing Supabase client:", error)
}

// Helper function to get harbors based on language
function getLocalHarbors(language) {
  switch (language) {
    case "fi":
      return fiHarbors
    case "sv":
      return svHarbors
    case "en":
    default:
      return enHarbors
  }
}

// Helper function to get trivia questions based on language
function getLocalTrivia(language) {
  switch (language) {
    case "fi":
      return fiTrivia
    case "sv":
      return svTrivia
    case "en":
    default:
      return enTrivia
  }
}

// Fetch harbor data with fallback to local data
export async function fetchHarborData(language = "fi") {
  try {
    if (supabase) {
      console.log(`Fetching harbor data from Supabase for language: ${language}`)
      const data = await fetchSupabaseHarborData(supabase, language)
      if (data && data.length > 0) {
        console.log(`Successfully fetched ${data.length} harbors from Supabase`)
        return data
      }
      console.log("No data returned from Supabase, falling back to local data")
    }
  } catch (error) {
    console.error("Error fetching harbor data from Supabase:", error)
  }

  console.log(`Using local harbor data for language: ${language}`)
  return getLocalHarbors(language)
}

// Fetch harbor trivia with fallback to local data
export async function fetchHarborTrivia(language = "fi") {
  try {
    if (supabase) {
      console.log(`Fetching trivia data from Supabase for language: ${language}`)
      const data = await fetchSupabaseHarborTrivia(supabase, language)
      if (data && data.length > 0) {
        console.log(`Successfully fetched ${data.length} trivia questions from Supabase`)
        return data
      }
      console.log("No trivia data returned from Supabase, falling back to local data")
    }
  } catch (error) {
    console.error("Error fetching trivia data from Supabase:", error)
  }

  console.log(`Using local trivia data for language: ${language}`)
  return getLocalTrivia(language)
}

// Fetch a random harbor with fallback to local data
export async function fetchRandomHarbor(language = "fi") {
  try {
    if (supabase) {
      console.log(`Fetching random harbor from Supabase for language: ${language}`)
      const harbor = await fetchSupabaseRandomHarbor(supabase, language)
      if (harbor) {
        console.log(`Successfully fetched random harbor from Supabase: ${harbor.name}`)
        return harbor
      }
      console.log("No random harbor returned from Supabase, falling back to local data")
    }
  } catch (error) {
    console.error("Error fetching random harbor from Supabase:", error)
  }

  // Fallback to local data
  console.log(`Using local data for random harbor selection (${language})`)
  const harbors = getLocalHarbors(language)
  const randomIndex = Math.floor(Math.random() * harbors.length)
  return harbors[randomIndex]
}

// Fetch random trivia questions with fallback to local data
export async function fetchRandomTriviaQuestions(language = "fi", count = 5) {
  try {
    if (supabase) {
      console.log(`Fetching ${count} random trivia questions from Supabase for language: ${language}`)
      const questions = await fetchSupabaseRandomTriviaQuestions(supabase, language, count)
      if (questions && questions.length > 0) {
        console.log(`Successfully fetched ${questions.length} random trivia questions from Supabase`)
        return questions
      }
      console.log("No random trivia questions returned from Supabase, falling back to local data")
    }
  } catch (error) {
    console.error("Error fetching random trivia questions from Supabase:", error)
  }

  // Fallback to local data
  console.log(`Using local data for random trivia question selection (${language})`)
  const triviaQuestions = getLocalTrivia(language)

  // Shuffle array and take the first 'count' elements
  const shuffled = [...triviaQuestions].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Update harbor view count
export async function updateHarborViewCount(harborId, language = "fi") {
  try {
    if (supabase) {
      console.log(`Updating view count for harbor ID ${harborId} (${language})`)
      await incrementHarborViewCount(supabase, harborId, language)
      return true
    }
  } catch (error) {
    console.error("Error updating harbor view count:", error)
  }
  return false
}

// Update trivia question view count
export async function updateTriviaViewCount(questionId, language = "fi") {
  try {
    if (supabase) {
      console.log(`Updating view count for trivia question ID ${questionId} (${language})`)
      await incrementTriviaViewCount(supabase, questionId, language)
      return true
    }
  } catch (error) {
    console.error("Error updating trivia view count:", error)
  }
  return false
}

// Export all harbors and trivia questions for direct access
export const allHarbors = {
  en: enHarbors,
  fi: fiHarbors,
  sv: svHarbors,
}

export const allTrivia = {
  en: enTrivia,
  fi: fiTrivia,
  sv: svTrivia,
}
