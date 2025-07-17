// This script tests the connection to Supabase
// Run with: node scripts/test-supabase-connection.js
require("dotenv").config({ path: ".env.local" })

const { createClient } = require("@supabase/supabase-js")

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase environment variables are missing")
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file")
  process.exit(1)
}

console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Key:", supabaseKey.substring(0, 10) + "...")

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log("Testing Supabase connection...")

    // Try a simple health check
    const { data, error } = await supabase.from("harbors").select("*").limit(1)

    if (error) {
      console.error("Error connecting to Supabase:", error)

      if (error.code === "PGRST301") {
        console.log("\nThe 'harbors' table might not exist yet. Let's check if we can access Supabase at all.")

        // Try to access auth.users which should always exist
        const { error: authError } = await supabase.auth.getSession()

        if (authError) {
          console.error("Could not connect to Supabase auth:", authError)
          console.log("\nThere seems to be a connection issue with Supabase.")
          console.log("Please check your credentials and network connection.")
        } else {
          console.log("\nSuccessfully connected to Supabase auth!")
          console.log("The tables might not exist yet. Let's try to create them.")

          console.log("\nYou can create the tables by running the SQL migration in the Supabase SQL editor.")
          console.log("Or you can try running the migration script which will attempt to create the tables:")
          console.log("node scripts/migrate-to-supabase.js")
        }
      } else {
        console.log("\nThere seems to be an issue with your Supabase connection.")
        console.log("Error code:", error.code)
        console.log("Error message:", error.message)
        console.log("Error details:", error.details)
      }
    } else {
      console.log("Successfully connected to Supabase!")

      if (data && data.length > 0) {
        console.log("Found existing harbor data:", data[0])
      } else {
        console.log("Connected to the harbors table, but no data found.")
        console.log("You can run the migration script to populate the tables:")
        console.log("node scripts/migrate-to-supabase.js")
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error)
  }
}

testConnection()
