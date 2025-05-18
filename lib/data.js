import * as supabaseData from "./supabase-data.js"
import { supabase } from "./supabase"

// Function to fetch harbor data with language support
export async function fetchHarborData(language = "fi") {
  try {
    // Fetch from Supabase
    const supabaseHarbors = await supabaseData.fetchHarborData(language)

    // If we got data from Supabase, return it
    if (supabaseHarbors && supabaseHarbors.length > 0) {
      console.log(`Fetched ${supabaseHarbors.length} harbors from Supabase in ${language}`)
      return supabaseHarbors
    } else {
      console.warn(`No harbors found in Supabase for language: ${language}`)
      // Return empty array instead of null to avoid errors
      return []
    }
  } catch (error) {
    console.error("Error fetching harbor data:", error)
    // Return empty array instead of null to avoid errors
    return []
  }
}

// Function to fetch a random harbor
export async function fetchRandomHarbor(language = "fi") {
  try {
    // Fetch from Supabase
    const randomHarbor = await supabaseData.fetchRandomHarbor(language)

    // If we got data from Supabase, return it
    if (randomHarbor) {
      console.log(`Fetched random harbor from Supabase in ${language}`)

      // Update view count
      if (randomHarbor.id) {
        try {
          await supabaseData.updateHarborViewCount(randomHarbor.id, language)
        } catch (error) {
          console.error("Error updating harbor view count:", error)
        }
      }

      return randomHarbor
    } else {
      console.warn(`No random harbor found in Supabase for language: ${language}`)
      return null
    }
  } catch (error) {
    console.error("Error fetching random harbor:", error)
    return null
  }
}

// Function to fetch trivia questions with language support
export async function fetchHarborTrivia(language = "fi") {
  try {
    // Fetch from Supabase
    const supabaseTrivia = await supabaseData.fetchHarborTrivia(language)

    // If we got data from Supabase, return it
    if (supabaseTrivia && supabaseTrivia.length > 0) {
      console.log(`Fetched ${supabaseTrivia.length} trivia questions from Supabase in ${language}`)
      return supabaseTrivia
    } else {
      console.warn(`No trivia questions found in Supabase for language: ${language}`)
      // Return empty array instead of null to avoid errors
      return []
    }
  } catch (error) {
    console.error("Error fetching trivia data:", error)
    // Return empty array instead of null to avoid errors
    return []
  }
}

// Function to fetch a random trivia question
export async function fetchRandomTriviaQuestion(language = "fi") {
  try {
    // Fetch from Supabase
    const randomQuestion = await supabaseData.fetchRandomTriviaQuestion(language)

    // If we got data from Supabase, return it
    if (randomQuestion) {
      console.log(`Fetched random trivia question from Supabase in ${language}`)
      return randomQuestion
    } else {
      console.warn(`No random trivia question found in Supabase for language: ${language}`)
      return null
    }
  } catch (error) {
    console.error("Error fetching random trivia question:", error)
    return null
  }
}

// Add this new function to fetch multiple random trivia questions
export async function fetchRandomTriviaQuestions(language = "fi", count = 5) {
  try {
    if (supabase) {
      try {
        // First attempt: Use the get_random_trivia_questions RPC function if available
        const { data, error } = await supabase.rpc("get_random_trivia_questions", {
          lang: language,
          num_questions: count,
        })

        if (!error && data && data.length > 0) {
          console.log(`Fetched ${data.length} random trivia questions from Supabase RPC in ${language}`)

          // Transform the data to match the expected format
          return data.map((question) => ({
            id: question.id,
            language: question.language,
            question: question.question,
            answers: question.answers,
            correctAnswer: question.correct_answer !== undefined ? question.correct_answer : 0,
            explanation: question.explanation,
            viewCount: question.view_count || 0,
            lastViewed: question.last_viewed,
          }))
        }

        // Second attempt: Regular query
        const { data: regularData, error: regularError } = await supabase
          .from("trivia_questions")
          .select("*")
          .eq("language", language)
          .order("last_viewed", { ascending: true, nullsFirst: true })
          .limit(count)

        if (!regularError && regularData && regularData.length > 0) {
          console.log(`Fetched ${regularData.length} trivia questions from Supabase query in ${language}`)

          // Update view counts
          const now = new Date().toISOString()
          const updates = regularData.map((question) => ({
            id: question.id,
            language: question.language,
            question: question.question,
            answers: question.answers,
            correct_answer: question.correct_answer,
            explanation: question.explanation || "No explanation available",
            view_count: (question.view_count || 0) + 1,
            last_viewed: now,
          }))

          // Don't await this to avoid slowing down the response
          supabase
            .from("trivia_questions")
            .upsert(updates)
            .then(({ error }) => {
              if (error) console.error("Error updating view counts:", error)
            })

          // Transform the data to match the expected format
          return regularData.map((question) => ({
            id: question.id,
            language: question.language,
            question: question.question,
            answers: question.answers,
            correctAnswer: question.correct_answer !== undefined ? question.correct_answer : 0,
            explanation: question.explanation,
            viewCount: question.view_count || 0,
            lastViewed: question.last_viewed,
          }))
        }

        // Third attempt: Manual fetch of individual questions
        const questions = []
        for (let i = 0; i < count; i++) {
          try {
            const randomQuestion = await supabaseData.fetchRandomTriviaQuestion(language)
            if (randomQuestion) {
              // Avoid duplicates
              if (!questions.some((q) => q.id === randomQuestion.id)) {
                questions.push(randomQuestion)
              } else {
                i--
              }
            }
          } catch (e) {
            console.error(`Error fetching random question ${i + 1}:`, e)
          }
        }

        if (questions.length > 0) {
          console.log(`Fetched ${questions.length} individual random trivia questions from Supabase in ${language}`)
          return questions
        }
      } catch (e) {
        console.error("Error fetching questions from Supabase:", e)
      }
    }

    console.warn("Could not fetch trivia questions from Supabase")
    return []
  } catch (error) {
    console.error("Error in fetchRandomTriviaQuestions:", error)
    return []
  }
}

// Function to save a location game score
export async function saveLocationGameScore(userId, score, rounds = 5, language = "fi") {
  try {
    return await supabaseData.saveLocationGameScore(userId, score, rounds, language)
  } catch (error) {
    console.error("Error saving location game score:", error)
    return null
  }
}

// Function to save a trivia game score
export async function saveTriviaGameScore(userId, score, questionsAnswered, correctAnswers, language = "fi") {
  try {
    return await supabaseData.saveTriviaGameScore(userId, score, questionsAnswered, correctAnswers, language)
  } catch (error) {
    console.error("Error saving trivia game score:", error)
    return null
  }
}

// Function to save a harbor guess
export async function saveHarborGuess(userId, harborId, language, attempts, distanceKm, correct, score) {
  try {
    return await supabaseData.saveHarborGuess(userId, harborId, language, attempts, distanceKm, correct, score)
  } catch (error) {
    console.error("Error saving harbor guess:", error)
    return null
  }
}

// Function to save a question answer
export async function saveQuestionAnswer(userId, questionId, language, answerIndex, correct, timeTakenSeconds, score) {
  try {
    return await supabaseData.saveQuestionAnswer(
      userId,
      questionId,
      language,
      answerIndex,
      correct,
      timeTakenSeconds,
      score,
    )
  } catch (error) {
    console.error("Error saving question answer:", error)
    return null
  }
}

// Function to get user's preferred language
export async function getUserPreferredLanguage(userId) {
  try {
    return await supabaseData.getUserPreferredLanguage(userId)
  } catch (error) {
    console.error("Error getting user preferred language:", error)
    return "fi" // Default to Finnish
  }
}

// Function to update user's preferred language
export async function updateUserPreferredLanguage(userId, language) {
  try {
    return await supabaseData.updateUserPreferredLanguage(userId, language)
  } catch (error) {
    console.error("Error updating user preferred language:", error)
    return false
  }
}

// Empty placeholders for backward compatibility
export const allHarbors = {}
export const allTriviaQuestions = {}
