import { createClient } from "@supabase/supabase-js"
import { getUserLanguage } from "./data"

// Initialize Supabase client lazily when needed
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not available")
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Save a harbor guess
export async function saveHarborGuess(userId, harborId, attempts, correct, distanceKm, score) {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: { message: "Supabase client not initialized" } }

  try {
    const { data, error } = await supabase
      .from("harbor_guesses")
      .insert({
        user_id: userId,
        harbor_id: harborId,
        attempts,
        correct,
        distance_km: distanceKm,
        score,
      })
      .select()
      .single()

    if (error) throw error

    // Check for achievements
    await checkLocationAchievements(userId)

    return { success: true, guess: data }
  } catch (error) {
    console.error("Error saving harbor guess:", error)
    return { error }
  }
}

// Save a trivia answer
export async function saveTriviaAnswer(userId, questionId, answerIndex, correct, timeTakenSeconds, score) {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: { message: "Supabase client not initialized" } }

  try {
    const language = getUserLanguage()

    const { data, error } = await supabase
      .from("trivia_answers")
      .insert({
        user_id: userId,
        question_id: questionId,
        language,
        answer_index: answerIndex,
        correct,
        time_taken_seconds: timeTakenSeconds,
        score,
      })
      .select()
      .single()

    if (error) throw error

    // Check for achievements
    await checkTriviaAchievements(userId)

    return { success: true, answer: data }
  } catch (error) {
    console.error("Error saving trivia answer:", error)
    return { error }
  }
}

// Save a game score
export async function saveGameScore(userId, gameType, score) {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: { message: "Supabase client not initialized" } }

  try {
    const language = getUserLanguage()

    const { data, error } = await supabase
      .from("game_scores")
      .insert({
        user_id: userId,
        game_type: gameType,
        score,
        language,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, gameScore: data }
  } catch (error) {
    console.error("Error saving game score:", error)
    return { error }
  }
}

// Get user's harbor guesses
export async function getUserHarborGuesses(userId) {
  const supabase = getSupabaseClient()
  if (!supabase) return { guesses: [] }

  try {
    const { data, error } = await supabase
      .from("harbor_guesses")
      .select(`
        *,
        harbors:harbor_id (
          name,
          region,
          coordinates
        )
      `)
      .eq("user_id", userId)
      .order("guessed_at", { ascending: false })

    if (error) throw error

    return { guesses: data || [] }
  } catch (error) {
    console.error("Error getting user harbor guesses:", error)
    return { guesses: [] }
  }
}

// Get user's trivia answers
export async function getUserTriviaAnswers(userId) {
  const supabase = getSupabaseClient()
  if (!supabase) return { answers: [] }

  try {
    const { data, error } = await supabase
      .from("trivia_answers")
      .select(`
        *,
        trivia_questions:question_id (
          question,
          answers,
          correct_answer
        )
      `)
      .eq("user_id", userId)
      .order("answered_at", { ascending: false })

    if (error) throw error

    return { answers: data || [] }
  } catch (error) {
    console.error("Error getting user trivia answers:", error)
    return { answers: [] }
  }
}

// Get user's game scores
export async function getUserGameScores(userId) {
  const supabase = getSupabaseClient()
  if (!supabase) return { scores: [] }

  try {
    const { data, error } = await supabase
      .from("game_scores")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })

    if (error) throw error

    return { scores: data || [] }
  } catch (error) {
    console.error("Error getting user game scores:", error)
    return { scores: [] }
  }
}

// Get leaderboard
export async function getLeaderboard(gameType, limit = 10) {
  const supabase = getSupabaseClient()
  if (!supabase) return { leaderboard: [] }

  try {
    const { data, error } = await supabase
      .from("game_scores")
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq("game_type", gameType)
      .order("score", { ascending: false })
      .limit(limit)

    if (error) throw error

    return { leaderboard: data || [] }
  } catch (error) {
    console.error("Error getting leaderboard:", error)
    return { leaderboard: [] }
  }
}

// Check for location game achievements
async function checkLocationAchievements(userId) {
  const supabase = getSupabaseClient()
  if (!supabase) return

  try {
    // Check "First Steps" achievement
    const { data: locationGames } = await supabase
      .from("game_scores")
      .select("count")
      .eq("user_id", userId)
      .eq("game_type", "location")

    if (locationGames?.count >= 1) {
      await unlockAchievement(userId, 1) // First Steps achievement ID
    }

    // Check "Explorer" achievement
    const { data: uniqueHarbors } = await supabase
      .from("harbor_guesses")
      .select("harbor_id")
      .eq("user_id", userId)
      .eq("correct", true)
      .limit(1000)

    const uniqueHarborIds = new Set(uniqueHarbors?.map((g) => g.harbor_id) || [])
    if (uniqueHarborIds.size >= 10) {
      await unlockAchievement(userId, 3) // Explorer achievement ID
    }

    // Check "Perfect Navigator" achievement
    const { data: perfectGuesses } = await supabase
      .from("harbor_guesses")
      .select("count")
      .eq("user_id", userId)
      .eq("attempts", 1)
      .eq("correct", true)

    if (perfectGuesses?.count >= 1) {
      await unlockAchievement(userId, 5) // Perfect Navigator achievement ID
    }
  } catch (error) {
    console.error("Error checking location achievements:", error)
  }
}

// Check for trivia game achievements
async function checkTriviaAchievements(userId) {
  const supabase = getSupabaseClient()
  if (!supabase) return

  try {
    // Check "Trivia Master" achievement
    const { data: triviaGames } = await supabase
      .from("game_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("game_type", "trivia")
      .order("completed_at", { ascending: false })
      .limit(1)

    if (triviaGames?.length > 0) {
      const latestGame = triviaGames[0]

      // Get the number of questions in the latest game
      const { data: questionCount } = await supabase
        .from("trivia_questions")
        .select("count")
        .eq("language", latestGame.language)

      // Get the number of correct answers in the latest game
      const { data: correctAnswers } = await supabase
        .from("trivia_answers")
        .select("count")
        .eq("user_id", userId)
        .eq("correct", true)
        .gte("answered_at", latestGame.completed_at - 3600) // Within an hour before game completion

      // If all answers were correct, unlock the achievement
      if (questionCount?.count > 0 && correctAnswers?.count >= questionCount?.count) {
        await unlockAchievement(userId, 2) // Trivia Master achievement ID
      }
    }
  } catch (error) {
    console.error("Error checking trivia achievements:", error)
  }
}

// Check for polyglot achievement
export async function checkPolyglotAchievement(userId) {
  const supabase = getSupabaseClient()
  if (!supabase) return

  try {
    const { data: languages } = await supabase.from("game_scores").select("language").eq("user_id", userId).limit(1000)

    const uniqueLanguages = new Set(languages?.map((g) => g.language) || [])
    if (uniqueLanguages.size >= 3) {
      // en, fi, sv
      await unlockAchievement(userId, 4) // Polyglot achievement ID
    }
  } catch (error) {
    console.error("Error checking polyglot achievement:", error)
  }
}

// Unlock an achievement for a user
async function unlockAchievement(userId, achievementId) {
  const supabase = getSupabaseClient()
  if (!supabase) return

  try {
    // Check if the user already has this achievement
    const { data: existingAchievement } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .maybeSingle()

    if (existingAchievement) return // Already unlocked

    // Unlock the achievement
    await supabase.from("user_achievements").insert({
      user_id: userId,
      achievement_id: achievementId,
    })
  } catch (error) {
    console.error(`Error unlocking achievement ${achievementId} for user ${userId}:`, error)
  }
}

// Get user's achievements
export async function getUserAchievements(userId) {
  const supabase = getSupabaseClient()
  if (!supabase) return { achievements: [] }

  try {
    const language = getUserLanguage()

    const { data, error } = await supabase
      .from("user_achievements")
      .select(`
        *,
        achievements:achievement_id (
          name,
          description,
          icon,
          points,
          language
        )
      `)
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false })

    if (error) throw error

    // Filter achievements by language
    const filteredAchievements = data?.filter((a) => a.achievements.language === language) || []

    return { achievements: filteredAchievements }
  } catch (error) {
    console.error("Error getting user achievements:", error)
    return { achievements: [] }
  }
}
