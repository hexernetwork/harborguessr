"use client"

import { useEffect, useState } from "react"
import { initializeDatabase } from "@/lib/db-utils"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export default function DatabaseInitializer() {
  const [status, setStatus] = useState("initializing") // 'initializing', 'success', 'error'
  const [error, setError] = useState(null)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if Supabase credentials are available
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn("Supabase credentials not available, skipping database initialization")
          setStatus("warning")
          setShowAlert(true)
          return
        }

        const result = await initializeDatabase()

        if (result.success) {
          setStatus("success")
          // Only show success alert if we actually seeded the database
          setShowAlert(!result.alreadySeeded)
        } else {
          setStatus("error")
          setError(result.error?.message || "Unknown error")
          setShowAlert(true)
        }
      } catch (err) {
        setStatus("error")
        setError(err.message || "Unknown error")
        setShowAlert(true)
      }
    }

    initialize()

    // Auto-hide alert after 5 seconds
    const timer = setTimeout(() => {
      setShowAlert(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (!showAlert) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {status === "success" && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
          <AlertTitle className="text-green-800 dark:text-green-300">Database Initialized</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            Harbor and trivia data has been successfully loaded.
          </AlertDescription>
        </Alert>
      )}

      {status === "warning" && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900">
          <AlertTitle className="text-amber-800 dark:text-amber-300">Using Local Data</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            Supabase credentials not found. Using local data instead.
          </AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900">
          <AlertTitle className="text-red-800 dark:text-red-300">Database Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error || "Failed to initialize database. Using local data instead."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
