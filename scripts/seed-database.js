import { createClient } from "@supabase/supabase-js"
import { multilingualData } from "../lib/data.js"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase credentials not found in environment variables")
  console.error("Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Create a logger that writes to both console and file
const logFile = path.join(process.cwd(), "seed-log.txt")
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] INFO: ${message}`
    console.log(logMessage)
    fs.appendFileSync(logFile, logMessage + "\n")
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString()
    const errorDetails = error ? `\n${error.stack || error}` : ""
    const logMessage = `[${timestamp}] ERROR: ${message}${errorDetails}`
    console.error(logMessage)
    fs.appendFileSync(logFile, logMessage + "\n")
  },
}

// Initialize log file
fs.writeFileSync(logFile, `Database Seed Log - Started at ${new Date().toISOString()}\n\n`)

// Function to seed harbors
async function seedHarbors() {
  logger.log("Starting to seed harbors...")

  for (const lang in multilingualData) {
    const langData = multilingualData[lang]
    logger.log(`Processing ${langData.harbors.length} harbors for language: ${lang}`)

    for (const harbor of langData.harbors) {
      try {
        // Insert harbor data
        const { error: harborError } = await supabase.from("harbors").upsert(
          {
            id: harbor.id,
            name: harbor.name,
            coordinates: harbor.coordinates,
            region: harbor.region,
            type: harbor.type,
            notable_feature: harbor.notableFeature,
            description: harbor.description,
            language: lang,
          },
          { onConflict: "id,language" },
        )

        if (harborError) throw harborError
        logger.log(`Inserted harbor: ${harbor.name} (${lang})`)

        // Insert hints for this harbor
        for (let i = 0; i < harbor.hints.length; i++) {
          const { error: hintError } = await supabase.from("harbor_hints").upsert(
            {
              harbor_id: harbor.id,
              hint_order: i + 1,
              hint_text: harbor.hints[i],
              language: lang,
            },
            { onConflict: "harbor_id,hint_order,language" },
          )

          if (hintError) throw hintError
        }
        logger.log(`Inserted ${harbor.hints.length} hints for harbor: ${harbor.name} (${lang})`)
      } catch (error) {
        logger.error(`Failed to insert harbor: ${harbor.name} (${lang})`, error)
      }
    }
  }

  logger.log("Finished seeding harbors")
}

// Function to seed trivia questions
async function seedTriviaQuestions() {
  logger.log("Starting to seed trivia questions...")

  for (const lang in multilingualData) {
    const langData = multilingualData[lang]
    logger.log(`Processing ${langData.triviaQuestions.length} trivia questions for language: ${lang}`)

    for (let i = 0; i < langData.triviaQuestions.length; i++) {
      try {
        const question = langData.triviaQuestions[i]
        const { error: questionError } = await supabase.from("trivia_questions").upsert(
          {
            id: i + 1,
            question: question.question,
            answers: question.answers,
            correct_answer: question.correctAnswer,
            explanation: question.explanation,
            language: lang,
          },
          { onConflict: "id,language" },
        )

        if (questionError) throw questionError
        logger.log(`Inserted trivia question #${i + 1} (${lang})`)
      } catch (error) {
        logger.error(`Failed to insert trivia question #${i + 1} (${lang})`, error)
      }
    }
  }

  logger.log("Finished seeding trivia questions")
}

// Function to seed achievements
async function seedAchievements() {
  logger.log("Starting to seed achievements...")

  const achievements = {
    en: [
      {
        name: "First Steps",
        description: "Complete your first harbor location game",
        icon: "map-pin",
        requirement: "Complete 1 location game",
        points: 10,
      },
      {
        name: "Trivia Master",
        description: "Score 100% on a trivia game",
        icon: "award",
        requirement: "Get all answers correct in a trivia game",
        points: 50,
      },
      {
        name: "Explorer",
        description: "Find 10 different harbors",
        icon: "compass",
        requirement: "Correctly identify 10 different harbors",
        points: 100,
      },
      {
        name: "Polyglot",
        description: "Play the game in all available languages",
        icon: "languages",
        requirement: "Play at least one game in each language",
        points: 30,
      },
      {
        name: "Perfect Navigator",
        description: "Find a harbor on the first try",
        icon: "target",
        requirement: "Identify a harbor with the first guess",
        points: 50,
      },
    ],
    fi: [
      {
        name: "Ensimmäiset askeleet",
        description: "Suorita ensimmäinen sataman sijaintipeli",
        icon: "map-pin",
        requirement: "Suorita 1 sijaintipeli",
        points: 10,
      },
      {
        name: "Tietovisan mestari",
        description: "Saa 100% tietovisassa",
        icon: "award",
        requirement: "Vastaa kaikkiin kysymyksiin oikein tietovisassa",
        points: 50,
      },
      {
        name: "Tutkimusmatkailija",
        description: "Löydä 10 eri satamaa",
        icon: "compass",
        requirement: "Tunnista oikein 10 eri satamaa",
        points: 100,
      },
      {
        name: "Kielitaituri",
        description: "Pelaa peliä kaikilla saatavilla olevilla kielillä",
        icon: "languages",
        requirement: "Pelaa vähintään yksi peli kullakin kielellä",
        points: 30,
      },
      {
        name: "Täydellinen navigoija",
        description: "Löydä satama ensimmäisellä yrityksellä",
        icon: "target",
        requirement: "Tunnista satama ensimmäisellä arvauksella",
        points: 50,
      },
    ],
    sv: [
      {
        name: "Första stegen",
        description: "Slutför ditt första hamnplaceringsspel",
        icon: "map-pin",
        requirement: "Slutför 1 placeringsspel",
        points: 10,
      },
      {
        name: "Triviamästare",
        description: "Få 100% på ett triviaspel",
        icon: "award",
        requirement: "Svara rätt på alla frågor i ett triviaspel",
        points: 50,
      },
      {
        name: "Utforskare",
        description: "Hitta 10 olika hamnar",
        icon: "compass",
        requirement: "Identifiera korrekt 10 olika hamnar",
        points: 100,
      },
      {
        name: "Polyglott",
        description: "Spela spelet på alla tillgängliga språk",
        icon: "languages",
        requirement: "Spela minst ett spel på varje språk",
        points: 30,
      },
      {
        name: "Perfekt navigatör",
        description: "Hitta en hamn på första försöket",
        icon: "target",
        requirement: "Identifiera en hamn med första gissningen",
        points: 50,
      },
    ],
  }

  for (const lang in achievements) {
    logger.log(`Processing ${achievements[lang].length} achievements for language: ${lang}`)

    for (let i = 0; i < achievements[lang].length; i++) {
      try {
        const achievement = achievements[lang][i]
        const { error } = await supabase.from("achievements").upsert(
          {
            id: i + 1,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            requirement: achievement.requirement,
            points: achievement.points,
            language: lang,
          },
          { onConflict: "id,language" },
        )

        if (error) throw error
        logger.log(`Inserted achievement: ${achievement.name} (${lang})`)
      } catch (error) {
        logger.error(`Failed to insert achievement: ${achievements[lang][i].name} (${lang})`, error)
      }
    }
  }

  logger.log("Finished seeding achievements")
}

// Main function to run all seeding operations
async function seedDatabase() {
  logger.log("Starting database seeding process...")

  try {
    // Check connection to Supabase
    const { error } = await supabase.from("harbors").select("count")
    if (error) throw new Error(`Failed to connect to Supabase: ${error.message}`)

    // Run seeding functions
    await seedHarbors()
    await seedTriviaQuestions()
    await seedAchievements()

    logger.log("Database seeding completed successfully!")
    return { success: true }
  } catch (error) {
    logger.error("Database seeding failed", error)
    return { success: false, error }
  }
}

// Run the seeding process
seedDatabase().then((result) => {
  if (result.success) {
    console.log("✅ Database seeding completed successfully!")
  } else {
    console.error("❌ Database seeding failed:", result.error)
    process.exit(1)
  }
})
