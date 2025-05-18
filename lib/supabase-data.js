import { supabase } from "./supabase"

// Function to fetch harbor data from Supabase
export async function fetchHarborData(language = "fi") {
  try {
    const { data, error } = await supabase
      .from("harbors")
      .select("*, harbor_hints(*)")
      .eq("language", language)
      .order("name")

    if (error) {
      console.error("Error fetching harbor data from Supabase:", error)
      return []
    }

    // Format the data to match the expected structure
    return data.map((harbor) => {
      // Extract hints from the harbor_hints relationship
      const hints = harbor.harbor_hints || []
      delete harbor.harbor_hints

      return {
        ...harbor,
        hints: hints.map((hint) => hint.hint_text),
      }
    })
  } catch (error) {
    console.error("Error in fetchHarborData:", error)
    return []
  }
}

// Function to fetch a random harbor from Supabase
export async function fetchRandomHarbor(language = "fi") {
  try {
    // First try to use the get_random_harbor RPC function if available
    try {
      const { data, error } = await supabase.rpc("get_random_harbor", {
        lang: language,
      })

      if (!error && data) {
        console.log("Fetched random harbor using RPC")

        // Format hints
        if (data.harbor_hints) {
          const hints = data.harbor_hints || []
          delete data.harbor_hints
          data.hints = hints.map((hint) => hint.hint_text)
        }

        // Update view count
        updateHarborViewCount(data.id, language).catch((err) => console.error("Error updating harbor view count:", err))

        return data
      }
    } catch (rpcError) {
      console.warn("RPC get_random_harbor not available or failed:", rpcError)
    }

    // Fallback to a regular query
    const { data, error } = await supabase
      .from("harbors")
      .select("*, harbor_hints(*)")
      .eq("language", language)
      .order("view_count", { ascending: true, nullsFirst: true })
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching random harbor from Supabase:", error)

      // Try another query with random ordering
      const { data: randomData, error: randomError } = await supabase
        .from("harbors")
        .select("*, harbor_hints(*)")
        .eq("language", language)
        .order("id", { ascending: false })
        .limit(1)
        .single()

      if (randomError) {
        console.error("Error fetching random harbor with alternate query:", randomError)
        return null
      }

      // Format the harbor data
      const harbor = randomData
      const hints = harbor.harbor_hints || []
      delete harbor.harbor_hints

      // Update view count
      updateHarborViewCount(harbor.id, language).catch((err) => console.error("Error updating harbor view count:", err))

      return {
        ...harbor,
        hints: hints.map((hint) => hint.hint_text),
      }
    }

    // Format the harbor data
    const harbor = data
    const hints = harbor.harbor_hints || []
    delete harbor.harbor_hints

    // Update view count
    updateHarborViewCount(harbor.id, language).catch((err) => console.error("Error updating harbor view count:", err))

    return {
      ...harbor,
      hints: hints.map((hint) => hint.hint_text),
    }
  } catch (error) {
    console.error("Error in fetchRandomHarbor:", error)
    return null
  }
}

// Function to update harbor view count
export async function updateHarborViewCount(harborId, language) {
  try {
    // First get the current view count
    const { data, error } = await supabase
      .from("harbors")
      .select("view_count")
      .eq("id", harborId)
      .eq("language", language)
      .single()

    if (error) {
      console.error("Error fetching harbor view count:", error)
      return
    }

    // Update the view count
    const currentCount = data.view_count || 0
    const { error: updateError } = await supabase
      .from("harbors")
      .update({
        view_count: currentCount + 1,
        last_viewed: new Date().toISOString(),
      })
      .eq("id", harborId)
      .eq("language", language)

    if (updateError) {
      console.error("Error updating harbor view count:", updateError)
    } else {
      console.log(`Updated view count for harbor ${harborId} to ${currentCount + 1}`)
    }
  } catch (error) {
    console.error("Error in updateHarborViewCount:", error)
  }
}

// Function to fetch trivia questions from Supabase
export async function fetchHarborTrivia(language = "fi") {
  try {
    const { data, error } = await supabase
      .from("trivia_questions")
      .select("*")
      .eq("language", language)
      .order("question")

    if (error) {
      console.error("Error fetching trivia questions from Supabase:", error)
      return []
    }

    // Format the data to match the expected structure
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
  } catch (error) {
    console.error("Error in fetchHarborTrivia:", error)
    return []
  }
}

// Function to fetch a random trivia question from Supabase
export async function fetchRandomTriviaQuestion(language = "fi") {
  try {
    // First try to use the get_random_trivia_question RPC function if available
    try {
      const { data, error } = await supabase.rpc("get_random_trivia_question", {
        lang: language,
      })

      if (!error && data) {
        console.log("Fetched random trivia question using RPC")

        // Update view count
        updateTriviaQuestionViewCount(data.id).catch((err) =>
          console.error("Error updating trivia question view count:", err),
        )

        return {
          id: data.id,
          language: data.language,
          question: data.question,
          answers: data.answers,
          correctAnswer: data.correct_answer !== undefined ? data.correct_answer : 0,
          explanation: data.explanation,
          viewCount: data.view_count || 0,
          lastViewed: data.last_viewed,
        }
      }
    } catch (rpcError) {
      console.warn("RPC get_random_trivia_question not available or failed:", rpcError)
    }

    // Fallback to a regular query
    const { data, error } = await supabase
      .from("trivia_questions")
      .select("*")
      .eq("language", language)
      .order("view_count", { ascending: true, nullsFirst: true })
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching random trivia question from Supabase:", error)

      // Try another query with random ordering
      const { data: randomData, error: randomError } = await supabase
        .from("trivia_questions")
        .select("*")
        .eq("language", language)
        .order("id", { ascending: false })
        .limit(1)
        .single()

      if (randomError) {
        console.error("Error fetching random trivia question with alternate query:", randomError)
        return null
      }

      // Update view count
      updateTriviaQuestionViewCount(randomData.id).catch((err) =>
        console.error("Error updating trivia question view count:", err),
      )

      return {
        id: randomData.id,
        language: randomData.language,
        question: randomData.question,
        answers: randomData.answers,
        correctAnswer: randomData.correct_answer !== undefined ? randomData.correct_answer : 0,
        explanation: randomData.explanation,
        viewCount: randomData.view_count || 0,
        lastViewed: randomData.last_viewed,
      }
    }

    // Update view count
    updateTriviaQuestionViewCount(data.id).catch((err) =>
      console.error("Error updating trivia question view count:", err),
    )

    return {
      id: data.id,
      language: data.language,
      question: data.question,
      answers: data.answers,
      correctAnswer: data.correct_answer !== undefined ? data.correct_answer : 0,
      explanation: data.explanation,
      viewCount: data.view_count || 0,
      lastViewed: data.last_viewed,
    }
  } catch (error) {
    console.error("Error in fetchRandomTriviaQuestion:", error)
    return null
  }
}

// Function to update trivia question view count
export async function updateTriviaQuestionViewCount(questionId) {
  try {
    // Get the full question data to ensure we have all required fields
    const { data, error } = await supabase.from("trivia_questions").select("*").eq("id", questionId).single()

    if (error) {
      console.error("Error fetching trivia question data:", error)
      return
    }

    if (!data) {
      console.error(`No trivia question found with id ${questionId}`)
      return
    }

    // Update the view count while preserving all other fields
    const currentCount = data.view_count || 0
    const { error: updateError } = await supabase
      .from("trivia_questions")
      .update({
        ...data,
        view_count: currentCount + 1,
        last_viewed: new Date().toISOString(),
      })
      .eq("id", questionId)
      .eq("language", data.language)

    if (updateError) {
      console.error("Error updating trivia question view count:", updateError)
    } else {
      console.log(`Updated view count for trivia question ${questionId} to ${currentCount + 1}`)
    }
  } catch (error) {
    console.error("Error in updateTriviaQuestionViewCount:", error)
  }
}

// Function to save a location game score
export async function saveLocationGameScore(userId, score, rounds = 5, language = "fi") {
  if (!userId) return null

  try {
    const { data, error } = await supabase.from("game_scores").insert([
      {
        user_id: userId,
        game_type: "location",
        score,
        language,
      },
    ])

    if (error) {
      console.error("Error saving location game score:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in saveLocationGameScore:", error)
    return null
  }
}

// Function to save a trivia game score
export async function saveTriviaGameScore(userId, score, questionsAnswered, correctAnswers, language = "fi") {
  if (!userId) return null

  try {
    const { data, error } = await supabase.from("game_scores").insert([
      {
        user_id: userId,
        game_type: "trivia",
        score,
        language,
      },
    ])

    if (error) {
      console.error("Error saving trivia game score:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in saveTriviaGameScore:", error)
    return null
  }
}

// Function to save a harbor guess
export async function saveHarborGuess(userId, harborId, language, attempts, distanceKm, correct, score) {
  if (!userId) return null

  try {
    const { data, error } = await supabase.from("harbor_guesses").insert([
      {
        user_id: userId,
        harbor_id: harborId,
        language,
        attempts,
        distance_km: distanceKm,
        correct,
        score,
      },
    ])

    if (error) {
      console.error("Error saving harbor guess:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in saveHarborGuess:", error)
    return null
  }
}

// Function to save a question answer
export async function saveQuestionAnswer(userId, questionId, language, answerIndex, correct, timeTakenSeconds, score) {
  if (!userId) return null

  try {
    const { data, error } = await supabase.from("trivia_answers").insert([
      {
        user_id: userId,
        question_id: questionId,
        language,
        answer_index: answerIndex,
        correct,
        time_taken_seconds: timeTakenSeconds,
        score,
      },
    ])

    if (error) {
      console.error("Error saving question answer:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in saveQuestionAnswer:", error)
    return null
  }
}

// Function to get user's preferred language
export async function getUserPreferredLanguage(userId) {
  if (!userId) return "fi"

  try {
    const { data, error } = await supabase.from("profiles").select("preferred_language").eq("id", userId).single()

    if (error || !data) {
      console.error("Error getting user preferred language:", error)
      return "fi"
    }

    return data.preferred_language || "fi"
  } catch (error) {
    console.error("Error in getUserPreferredLanguage:", error)
    return "fi"
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
    console.error("Error in updateUserPreferredLanguage:", error)
    return false
  }
}
