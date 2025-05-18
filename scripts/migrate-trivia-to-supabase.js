// Script to migrate trivia questions from JS files to Supabase
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

// Import trivia data from the JS files
const { triviaQuestions: enTrivia } = require("../lib/entrivia.js")
const { triviaQuestions: fiTrivia } = require("../lib/fintrivia.js")
const { triviaQuestions: svTrivia } = require("../lib/swetrivia.js")

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase environment variables are missing.")
  console.error(
    "Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.",
  )
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Function to check if the trivia_questions table exists
async function checkTriviaTable() {
  try {
    const { error } = await supabase.from("trivia_questions").select("id").limit(1)

    if (error && error.code === "42P01") {
      console.error("Error: trivia_questions table does not exist.")
      console.error("Please run the SQL migration script to create the table first.")
      return false
    }

    return true
  } catch (error) {
    console.error("Error checking trivia_questions table:", error)
    return false
  }
}

// Function to migrate trivia questions to Supabase
async function migrateTrivia() {
  console.log("Starting trivia migration...")

  // Check if the table exists before proceeding
  const tableExists = await checkTriviaTable()
  if (!tableExists) {
    return { successCount: 0, errorCount: 0, skipped: true }
  }

  // Combine all trivia questions
  const allTrivia = [
    ...enTrivia.map((q) => ({ ...q, language: "en" })),
    ...fiTrivia.map((q) => ({ ...q, language: "fi" })),
    ...svTrivia.map((q) => ({ ...q, language: "sv" })),
  ]

  console.log(`Found ${allTrivia.length} trivia questions to migrate:`)
  console.log(`- English: ${enTrivia.length}`)
  console.log(`- Finnish: ${fiTrivia.length}`)
  console.log(`- Swedish: ${svTrivia.length}`)

  let successCount = 0
  let errorCount = 0

  // Process each trivia question
  for (const question of allTrivia) {
    try {
      // Normalize the data structure for Supabase
      const triviaData = {
        id: question.id,
        question: question.question,
        answers: question.answers,
        correct_answer: question.correctAnswer !== undefined ? question.correctAnswer : question.correct_answer,
        explanation: question.explanation || "No explanation available",
        language: question.language,
        view_count: 0,
        last_viewed: null,
      }

      // Insert or update the question in Supabase
      const { error } = await supabase.from("trivia_questions").upsert(triviaData, {
        onConflict: "id,language",
        returning: "minimal",
      })

      if (error) {
        console.error(`Error inserting trivia question ID ${question.id} (${question.language}):`, error)
        errorCount++
      } else {
        console.log(`Successfully migrated trivia question: ID ${question.id} (${question.language})`)
        successCount++
      }
    } catch (error) {
      console.error(`Unexpected error processing trivia question ${question.id}:`, error)
      errorCount++
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log("\nTrivia migration summary:")
  console.log(`- Total questions: ${allTrivia.length}`)
  console.log(`- Successfully migrated: ${successCount}`)
  console.log(`- Failed: ${errorCount}`)

  return { successCount, errorCount, skipped: false }
}

// Function to verify the migration by counting records
async function verifyMigration() {
  try {
    const { data, error } = await supabase
      .from("trivia_questions")
      .select("language", { count: "exact" })
      .order("language")

    if (error) {
      console.error("Error verifying migration:", error)
      return
    }

    // Group by language and count
    const counts = {}
    data.forEach((item) => {
      counts[item.language] = (counts[item.language] || 0) + 1
    })

    console.log("\nVerification results:")
    console.log("Total trivia questions in database:", data.length)

    for (const [language, count] of Object.entries(counts)) {
      console.log(`- ${language.toUpperCase()}: ${count} questions`)
    }
  } catch (error) {
    console.error("Error during verification:", error)
  }
}

// Main function to run the migration
async function main() {
  console.log("=== Trivia Migration Script ===")
  console.log("Connecting to Supabase...")

  try {
    // Test the connection
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error connecting to Supabase:", error)
      process.exit(1)
    }

    console.log("Successfully connected to Supabase!")

    // Run the migration
    const result = await migrateTrivia()

    if (!result.skipped) {
      // Verify the migration
      await verifyMigration()
    }

    console.log("\nMigration process completed!")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

// Run the script
main()
