import { supabase } from "./supabase"

// Function to fetch harbor data from Supabase with language support
export async function fetchHarborData(language = "fi") {
  try {
    // Check if supabase is initialized
    if (!supabase) {
      console.error("Supabase client not initialized")
      return []
    }

    // First, fetch the harbors
    const { data: harbors, error: harborsError } = await supabase
      .from("harbors")
      .select("*")
      .eq("language", language)
      .order("id", { ascending: true })

    if (harborsError) {
      console.error("Error fetching harbors:", harborsError)
      return []
    }

    // Then, fetch the hints for all harbors
    const { data: allHints, error: hintsError } = await supabase
      .from("harbor_hints")
      .select("*")
      .eq("language", language)
      .order("hint_order", { ascending: true })

    if (hintsError) {
      console.error("Error fetching harbor hints:", hintsError)
      return []
    }

    // Group hints by harbor_id
    const hintsByHarborId = {}
    allHints.forEach((hint) => {
      if (!hintsByHarborId[hint.harbor_id]) {
        hintsByHarborId[hint.harbor_id] = []
      }
      hintsByHarborId[hint.harbor_id].push(hint.hint_text)
    })

    // Combine harbors with their hints
    const harborsWithHints = harbors.map((harbor) => ({
      id: harbor.id,
      name: harbor.name,
      language: harbor.language,
      coordinates: harbor.coordinates,
      region: harbor.region,
      type: harbor.type,
      notableFeature: harbor.notable_feature,
      description: harbor.description,
      hints: hintsByHarborId[harbor.id] || [],
      viewCount: harbor.view_count || 0,
      lastViewed: harbor.last_viewed,
    }))

    return harborsWithHints
  } catch (error) {
    console.error("Failed to fetch harbor data:", error)
    return []
  }
}

// Function to fetch a random harbor based on view count
export async function fetchRandomHarbor(language = "fi") {
  try {
    // Check if supabase is initialized
    if (!supabase) {
      console.error("Supabase client not initialized")
      return null
    }

    // Use the get_random_harbor function
    const { data, error } = await supabase.rpc("get_random_harbor", { lang: language })

    if (error) {
      console.error("Error fetching random harbor:", error)
      return null
    }

    if (!data || data.length === 0) {
      console.error("No harbors found")
      return null
    }

    const harbor = data[0]

    // Fetch hints for this harbor
    const { data: hints, error: hintsError } = await supabase
      .from("harbor_hints")
      .select("hint_text")
      .eq("harbor_id", harbor.id)
      .eq("language", language)
      .order("hint_order", { ascending: true })

    if (hintsError) {
      console.error("Error fetching harbor hints:", hintsError)
    }

    // Increment the view count manually
    await supabase.rpc("increment_harbor_views", { harbor_id: harbor.id, lang: language })

    // Return the harbor with hints
    return {
      id: harbor.id,
      name: harbor.name,
      language: harbor.language,
      coordinates: harbor.coordinates,
      region: harbor.region,
      type: harbor.type,
      notableFeature: harbor.notable_feature,
      description: harbor.description,
      hints: hints ? hints.map((h) => h.hint_text) : [],
      viewCount: harbor.view_count,
      lastViewed: harbor.last_viewed,
    }
  } catch (error) {
    console.error("Failed to fetch random harbor:", error)
    return null
  }
}

// Function to fetch trivia questions from Supabase with language support
export async function fetchHarborTrivia(language = "fi") {
  try {
    // Check if supabase is initialized
    if (!supabase) {
      console.error("Supabase client not initialized")
      return []
    }

    const { data, error } = await supabase
      .from("trivia_questions")
      .select("*")
      .eq("language", language)
      .order("id", { ascending: true })

    if (error) {
      console.error("Error fetching trivia questions:", error)
      return []
    }

    // Transform the data to match the expected format
    return data.map((question) => ({
      id: question.id,
      language: question.language,
      question: question.question,
      answers: question.answers,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      viewCount: question.view_count || 0,
      lastViewed: question.last_viewed,
    }))
  } catch (error) {
    console.error("Failed to fetch trivia data:", error)
    return []
  }
}

// Function to fetch a random trivia question based on view count
export async function fetchRandomTriviaQuestion(language = "fi") {
  try {
    // Check if supabase is initialized
    if (!supabase) {
      console.error("Supabase client not initialized")
      return null
    }

    // Use the get_random_trivia_question function
    const { data, error } = await supabase.rpc("get_random_trivia_question", { lang: language })

    if (error) {
      console.error("Error fetching random trivia question:", error)
      return null
    }

    if (!data || data.length === 0) {
      console.error("No trivia questions found")
      return null
    }

    const question = data[0]

    // Increment the view count manually
    await supabase.rpc("increment_trivia_views", { question_id: question.id, lang: language })

    // Return the question
    return {
      id: question.id,
      language: question.language,
      question: question.question,
      answers: question.answers,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      viewCount: question.view_count,
      lastViewed: question.last_viewed,
    }
  } catch (error) {
    console.error("Failed to fetch random trivia question:", error)
    return null
  }
}

// Function to save a location game score to Supabase
export async function saveLocationGameScore(userId, score, rounds = 5, language = "fi") {
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from("game_scores")
      .insert({
        user_id: userId,
        game_type: "location",
        score,
        language,
      })
      .select()

    if (error) {
      console.error("Error saving location game score:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Failed to save location game score:", error)
    return null
  }
}

// Function to save a trivia game score to Supabase
export async function saveTriviaGameScore(userId, score, questionsAnswered, correctAnswers, language = "fi") {
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from("game_scores")
      .insert({
        user_id: userId,
        game_type: "trivia",
        score,
        language,
      })
      .select()

    if (error) {
      console.error("Error saving trivia game score:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Failed to save trivia game score:", error)
    return null
  }
}

// Function to save a harbor guess to Supabase
export async function saveHarborGuess(userId, harborId, language, attempts, distanceKm, correct, score) {
  if (!userId) return null

  try {
    const { data, error } = await supabase.from("harbor_guesses").insert({
      user_id: userId,
      harbor_id: harborId,
      language,
      attempts,
      distance_km: distanceKm,
      correct,
      score,
    })

    if (error) {
      console.error("Error saving harbor guess:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Failed to save harbor guess:", error)
    return null
  }
}

// Function to save a question answer to Supabase
export async function saveQuestionAnswer(userId, questionId, language, answerIndex, correct, timeTakenSeconds, score) {
  if (!userId) return null

  try {
    const { data, error } = await supabase.from("trivia_answers").insert({
      user_id: userId,
      question_id: questionId,
      language,
      answer_index: answerIndex,
      correct,
      time_taken_seconds: timeTakenSeconds,
      score,
    })

    if (error) {
      console.error("Error saving question answer:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Failed to save question answer:", error)
    return null
  }
}

// Function to get user's preferred language
export async function getUserPreferredLanguage(userId) {
  if (!userId) return "fi" // Default to Finnish as requested

  try {
    const { data, error } = await supabase.from("profiles").select("preferred_language").eq("id", userId).single()

    if (error || !data) {
      console.error("Error fetching user preferred language:", error)
      return "fi" // Default to Finnish
    }

    return data.preferred_language || "fi" // Default to Finnish if not set
  } catch (error) {
    console.error("Failed to fetch user preferred language:", error)
    return "fi" // Default to Finnish
  }
}

// Function to update user's preferred language
export async function updateUserPreferredLanguage(userId, language) {
  if (!userId) return false

  try {
    const { error } = await supabase.from("profiles").update({ preferred_language: language }).eq("id", userId)

    if (error) {
      console.error("Error updating user preferred language:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to update user preferred language:", error)
    return false
  }
}
