// Script to migrate trivia questions to Supabase
import { createClient } from "@supabase/supabase-js"
import { triviaQuestions as enTrivia } from "../lib/entrivia.js"
import { triviaQuestions as fiTrivia } from "../lib/fintrivia.js"
import { triviaQuestions as svTrivia } from "../lib/swetrivia.js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables. Please check your .env.local file.")
  process.exit(1)
}

console.log("Starting trivia migration to Supabase...")
console.log(`Using Supabase URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to clear trivia tables
async function clearTriviaTables() {
  console.log("Clearing trivia tables...")
  try {
    const { error } = await supabase.from("trivia_questions").delete().neq("id", 0) // Delete all records

    if (error) {
      console.error("Error clearing trivia tables:", error)
      return false
    }

    console.log("Trivia tables cleared successfully!")
    return true
  } catch (error) {
    console.error("Error clearing trivia tables:", error)
    return false
  }
}

// Function to migrate trivia questions
async function migrateTrivia(triviaQuestions, language) {
  console.log(`Starting trivia migration for language: ${language}`)
  let successCount = 0
  let errorCount = 0

  for (const question of triviaQuestions) {
    try {
      // Insert trivia question
      const { data, error } = await supabase.from("trivia_questions").insert({
        id: question.id,
        question: question.question,
        answers: question.answers,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        language: language,
        view_count: 0,
      })

      if (error) {
        console.error(`Error inserting trivia question ID ${question.id} (${language}):`, error)
        errorCount++
      } else {
        console.log(`Successfully inserted trivia question: ID ${question.id} (${language})`)
        successCount++
      }
    } catch (error) {
      console.error(`Error inserting trivia question ID ${question.id} (${language}):`, error)
      errorCount++
    }
  }

  return { successCount, errorCount }
}

// Main function to run the migration
async function runMigration() {
  try {
    // Test connection to Supabase
    const { data, error } = await supabase.from("trivia_questions").select("count(*)")
    if (error) {
      console.error("Error connecting to Supabase:", error)
      return
    }

    console.log("Successfully connected to Supabase!")

    // Ask if we should clear the tables first
    const shouldClear = process.argv.includes("--clear")
    if (shouldClear) {
      const cleared = await clearTriviaTables()
      if (!cleared) {
        console.log("Continuing without clearing tables...")
      }
    }

    // Migrate trivia questions for each language
    const enResults = await migrateTrivia(enTrivia, "en")
    const fiResults = await migrateTrivia(fiTrivia, "fi")
    const svResults = await migrateTrivia(svTrivia, "sv")

    // Print summary
    console.log(
      "\nTrivia migration completed!",
      `Success: ${enResults.successCount + fiResults.successCount + svResults.successCount},`,
      `Errors: ${enResults.errorCount + fiResults.errorCount + svResults.errorCount}`,
    )

    console.log("\nMigration Summary:")
    console.log(`English Trivia: ${enResults.successCount} succeeded, ${enResults.errorCount} failed`)
    console.log(`Finnish Trivia: ${fiResults.successCount} succeeded, ${fiResults.errorCount} failed`)
    console.log(`Swedish Trivia: ${svResults.successCount} succeeded, ${svResults.errorCount} failed`)
  } catch (error) {
    console.error("Unexpected error during migration:", error)
  }
}

// Run the migration
runMigration()
