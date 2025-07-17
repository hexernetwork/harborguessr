// supabase-data.js
import { supabase } from "./supabase"

// Function to get user creation date from auth.users table
export async function getUserCreatedAt(userId) {
  try {
    const { data, error } = await supabase.rpc('get_user_created_at', {
      user_id: userId
    })

    if (error) {
      console.error("Error fetching user creation date:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserCreatedAt:", error)
    return null
  }
}

// Function to fetch harbor data from Supabase
export async function fetchHarborData(language = "fi") {
  try {
    const { data, error } = await supabase
      .from("harbors")
      .select(`
        *,
        harbor_hints!inner(hint_text, hint_order)
      `)
      .eq("language", language)
      .order("view_count", { ascending: true })

    if (error) {
      console.error("Error fetching harbor data:", error)
      return []
    }

    // Transform the data to include hints properly
    return data.map(harbor => ({
      ...harbor,
      hints: harbor.harbor_hints
        .sort((a, b) => a.hint_order - b.hint_order)
        .map(hint => hint.hint_text)
    }))
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
    const { error } = await supabase
      .from("harbors")
      .update({ 
        view_count: supabase.raw('view_count + 1'),
        last_viewed: new Date().toISOString()
      })
      .eq("id", harborId)
      .eq("language", language)

    if (error) {
      console.error("Error updating harbor view count:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateHarborViewCount:", error)
    return false
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
export async function saveLocationGameScore(
  userId = null, 
  score = 0, 
  rounds = 3, 
  sessionId = null, 
  gameDuration = null, 
  nickname = null
) {
  try {
    console.log("Saving location game score:", {
      userId,
      score,
      rounds,
      sessionId,
      gameDuration,
      nickname
    });

    // Validate inputs
    if (!userId && !sessionId) {
      throw new Error("Either userId or sessionId must be provided");
    }

    // Get display name for registered users
    let displayName = nickname;
    if (userId) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user && user.id === userId) {
          displayName = user.user_metadata?.username || 
                      user.user_metadata?.display_name ||
                      user.email?.split('@')[0] || 
                      null;
          console.log("Extracted display name for registered user:", displayName);
        }
      } catch (userFetchError) {
        console.warn("Could not fetch user display name:", userFetchError);
      }
    }

    // Create the game score data
    const gameScoreData = {
      game_type: 'location',
      score: Number(score) || 0,
      language: 'fi',
      game_duration_seconds: gameDuration,
      questions_answered: rounds, // Use rounds as questions for location game
      correct_answers: rounds // Assume all rounds completed for location game
    };

    // Add user identification
    if (userId) {
      gameScoreData.user_id = userId;
      // Add nickname to game_scores so trigger can use it
      if (displayName) {
        gameScoreData.nickname = displayName;
      }
    } else if (sessionId) {
      gameScoreData.session_id = sessionId;
      if (nickname) {
        gameScoreData.nickname = nickname.trim();
      }
    }

    // Add metadata
    gameScoreData.metadata = {
      rounds_completed: Number(rounds) || 3,
      total_rounds: 3,
      average_score_per_round: rounds > 0 ? Math.round(score / rounds) : 0,
      duration_seconds: gameDuration,
      display_name: displayName // Include in metadata as backup
    };

    console.log("Saving location game score data with nickname:", gameScoreData);

    // Save to game_scores table (let trigger handle leaderboard)
    const { data: gameData, error: gameError } = await supabase
      .from('game_scores')
      .insert(gameScoreData)
      .select()
      .single();

    if (gameError) {
      console.error("Error saving location game score:", gameError);
      throw gameError;
    }

    console.log("Location game score saved successfully with nickname:", gameData);
    return gameData;

  } catch (error) {
    console.error("Error in saveLocationGameScore:", error);
    throw error;
  }
}

// Function to fetch random trivia questions
export async function fetchRandomTriviaQuestions(language = "fi", count = 5) {
  try {
    const { data, error } = await supabase
      .from("trivia_questions")
      .select("*")
      .eq("language", language)
      .order("view_count", { ascending: true, nullsFirst: true })
      .limit(count)

    if (error) {
      console.error("Error fetching trivia questions:", error)
      return []
    }

    console.log(`Fetched ${data.length} trivia questions from Supabase query in ${language}`)

    // Transform the data to match the expected format
    return data.map((question) => ({
      id: question.id,
      language: question.language,
      question: question.question,
      answers: question.answers,
      correctAnswer: question.correct_answer !== undefined ? question.correct_answer : 0,
      explanation: question.explanation || "No explanation available",
      viewCount: question.view_count || 0,
      lastViewed: question.last_viewed,
    }))
  } catch (error) {
    console.error("Error in fetchRandomTriviaQuestions:", error)
    return []
  }
}

// Helper function to get user display name
async function getUserDisplayName(userId) {
  try {
    // Try to get user from auth session first
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user && user.id === userId) {
      // Use email or user metadata display name
      return user.user_metadata?.display_name || 
             user.user_metadata?.full_name || 
             user.email?.split('@')[0] || 
             `User ${userId.slice(-6)}`
    }
    
    // Fallback to user ID suffix
    return `User ${userId.slice(-6)}`
  } catch (error) {
    console.error("Error getting user display name:", error)
    return `User ${userId.slice(-6)}`
  }
}

// Function to save a trivia game score (SINGLE FUNCTION - FIXED)
// Replace your saveTriviaGameScore function with this solution:

export async function saveTriviaGameScore(
  userId = null,
  score = 0,
  totalQuestions = 5,
  correctAnswers = 0,
  sessionId = null,
  gameDuration = null,
  nickname = null
) {
  try {
    console.log("Saving trivia game score:", {
      userId,
      score,
      totalQuestions,
      correctAnswers,
      sessionId,
      gameDuration,
      nickname
    });

    // Validate inputs
    if (!userId && !sessionId) {
      throw new Error("Either userId or sessionId must be provided");
    }

    // Get display name for registered users
    let displayName = nickname;
    if (userId) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user && user.id === userId) {
          displayName = user.user_metadata?.username || 
                      user.user_metadata?.display_name ||
                      user.email?.split('@')[0] || 
                      null;
          console.log("Extracted display name for registered user:", displayName);
        }
      } catch (userFetchError) {
        console.warn("Could not fetch user display name:", userFetchError);
      }
    }

    // Create the game score data
    const gameScoreData = {
      game_type: 'trivia',
      score: Number(score) || 0,
      language: 'fi',
      game_duration_seconds: gameDuration,
      questions_answered: totalQuestions,
      correct_answers: correctAnswers
    };

    // Add user identification
    if (userId) {
      gameScoreData.user_id = userId;
      // Add nickname to game_scores so trigger can use it
      if (displayName) {
        gameScoreData.nickname = displayName;
      }
    } else if (sessionId) {
      gameScoreData.session_id = sessionId;
      if (nickname) {
        gameScoreData.nickname = nickname.trim();
      }
    }

    // Add metadata
    if (totalQuestions > 0) {
      gameScoreData.metadata = {
        total_questions: Number(totalQuestions),
        correct_answers: Number(correctAnswers) || 0,
        accuracy: Math.round((Number(correctAnswers) / Number(totalQuestions)) * 100),
        duration_seconds: gameDuration,
        display_name: displayName // Include in metadata as backup
      };
    }

    console.log("Saving game score data with nickname:", gameScoreData);

    // Save to game_scores table (let trigger handle leaderboard)
    const { data: gameData, error: gameError } = await supabase
      .from('game_scores')
      .insert(gameScoreData)
      .select()
      .single();

    if (gameError) {
      console.error("Error saving game score:", gameError);
      throw gameError;
    }

    console.log("Game score saved successfully with nickname:", gameData);
    return gameData;

  } catch (error) {
    console.error("Error in saveTriviaGameScore:", error);
    throw error;
  }
}

// Function to save a harbor guess
export async function saveHarborGuess(userId, harborId, language, attempts, distanceKm, correct, score, sessionId = null) {
  try {
    const insertData = {
      harbor_id: harborId,
      language,
      attempts,
      distance_km: distanceKm,
      correct,
      score,
    }

    if (userId && userId.length > 10) {
      insertData.user_id = userId
    } else if (sessionId) {
      insertData.session_id = sessionId
    }

    const { error } = await supabase.from("harbor_guesses").insert([insertData])

    if (error) {
      console.error("Error saving harbor guess:", error)
      return null
    }

    return true
  } catch (error) {
    console.error("Error in saveHarborGuess:", error)
    return null
  }
}

// Function to save a question answer
export async function saveQuestionAnswer(userId, questionId, language, answerIndex, correct, timeTakenSeconds, score, sessionId = null) {
  try {
    const insertData = {
      question_id: questionId,
      language,
      answer_index: answerIndex,
      correct,
      time_taken_seconds: timeTakenSeconds,
      score,
    }

    // Add user_id if provided, otherwise use session_id for anonymous users
    if (userId) {
      insertData.user_id = userId
    } else if (sessionId) {
      insertData.session_id = sessionId
    }

    const { data, error } = await supabase.from("trivia_answers").insert([insertData])

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

// Function to get user's preferred language - now gets it from auth.users metadata
export async function getUserPreferredLanguage(userId) {
  if (!userId) return "fi"

  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)

    if (error || !user) {
      console.error("Error getting user data:", error)
      return "fi"
    }

    return user.user_metadata?.preferred_language || "fi"
  } catch (error) {
    console.error("Error in getUserPreferredLanguage:", error)
    return "fi"
  }
}

// Function to update user's preferred language - now updates auth.users metadata
export async function updateUserPreferredLanguage(userId, language) {
  if (!userId) return false

  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { preferred_language: language }
    })

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