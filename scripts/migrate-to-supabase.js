// This script migrates all harbor and trivia data to Supabase
// Run with: node scripts/migrate-to-supabase.js
require("dotenv").config({ path: ".env.local" })

const { createClient } = require("@supabase/supabase-js")
const { harbors: enHarbors } = require("../lib/endata.js")
const { harbors: fiHarbors } = require("../lib/findata.js")
const { harbors: svHarbors } = require("../lib/swedata.js")
const { triviaQuestions: enTrivia } = require("../lib/entrivia.js")
const { triviaQuestions: fiTrivia } = require("../lib/fintrivia.js")
const { triviaQuestions: svTrivia } = require("../lib/swetrivia.js")
// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase environment variables are missing")
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateHarbors() {
  console.log("Starting harbor migration...")

  // Combine all harbors
  const allHarbors = [...enHarbors, ...fiHarbors, ...svHarbors]
  let successCount = 0
  let errorCount = 0

  for (const harbor of allHarbors) {
    try {
      // First, insert the harbor data
      const harborData = {
        id: harbor.id,
        name: harbor.name,
        coordinates: harbor.coordinates,
        region: harbor.region,
        type: harbor.type,
        notable_feature: harbor.notableFeature || "None", // Provide default if missing
        description: harbor.description || "No description available", // Provide default if missing
        language: harbor.language,
        view_count: 0, // Initialize view count to 0
        last_viewed: null, // Initialize last_viewed to null
      }

      const { error: harborError } = await supabase.from("harbors").upsert(harborData, { onConflict: "id,language" })

      if (harborError) {
        console.error(`Error inserting harbor ${harbor.name} (${harbor.language}):`, harborError)
        errorCount++
        continue
      }

      console.log(`Successfully inserted harbor: ${harbor.name} (${harbor.language})`)
      successCount++

      // Then, insert the hints
      if (harbor.hints && harbor.hints.length > 0) {
        for (let i = 0; i < harbor.hints.length; i++) {
          const hint = harbor.hints[i]
          const hintData = {
            harbor_id: harbor.id,
            hint_order: i + 1,
            hint_text: hint,
            language: harbor.language,
          }

          const { error: hintError } = await supabase
            .from("harbor_hints")
            .upsert(hintData, { onConflict: "harbor_id,hint_order,language" })

          if (hintError) {
            console.error(`Error inserting hint for harbor ${harbor.name} (${harbor.language}):`, hintError)
          } else {
            console.log(`Successfully inserted hint ${i + 1} for harbor ${harbor.name} (${harbor.language})`)
          }
        }
      }
    } catch (error) {
      console.error(`Unexpected error processing harbor ${harbor.name}:`, error)
      errorCount++
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log(`Harbor migration completed! Success: ${successCount}, Errors: ${errorCount}`)
  return { successCount, errorCount }
}

async function migrateTrivia() {
  console.log("Starting trivia migration...")

  // Combine all trivia questions
  const allTrivia = [...enTrivia, ...fiTrivia, ...svTrivia]
  let successCount = 0
  let errorCount = 0

  for (const question of allTrivia) {
    try {
      const triviaData = {
        id: question.id,
        question: question.question,
        answers: question.answers,
        correct_answer: question.correctAnswer,
        explanation: question.explanation || "No explanation available", // Provide default if missing
        language: question.language,
        view_count: 0, // Initialize view count to 0
        last_viewed: null, // Initialize last_viewed to null
      }

      const { error } = await supabase.from("trivia_questions").upsert(triviaData, { onConflict: "id,language" })

      if (error) {
        console.error(`Error inserting trivia question ID ${question.id} (${question.language}):`, error)
        errorCount++
      } else {
        console.log(`Successfully inserted trivia question: ID ${question.id} (${question.language})`)
        successCount++
      }
    } catch (error) {
      console.error(`Unexpected error processing trivia question ${question.id}:`, error)
      errorCount++
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log(`Trivia migration completed! Success: ${successCount}, Errors: ${errorCount}`)
  return { successCount, errorCount }
}

async function runMigration() {
  try {
    console.log("Starting data migration to Supabase...")
    console.log(`Using Supabase URL: ${supabaseUrl}`)

    // Check connection
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error connecting to Supabase:", error)
      console.log("Please check your credentials and network connection.")
      return
    }

    console.log("Successfully connected to Supabase!")

    // Run migrations
    const harborResults = await migrateHarbors()
    const triviaResults = await migrateTrivia()

    console.log("\nMigration Summary:")
    console.log(`Harbors: ${harborResults.successCount} succeeded, ${harborResults.errorCount} failed`)
    console.log(`Trivia Questions: ${triviaResults.successCount} succeeded, ${triviaResults.errorCount} failed`)
    console.log("\nData migration completed!")
  } catch (error) {
    console.error("Migration failed:", error)
  }
}

// Run the migration
runMigration()
