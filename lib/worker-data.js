// lib/worker-data.js
/**
 * All game data fetching through the Cloudflare Worker
 * This replaces direct Supabase calls for game content
 */
const WORKER_BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL
if (!WORKER_BASE_URL) {
  console.error("NEXT_PUBLIC_WORKER_URL environment variable is not set!")
}

/**
 * Fetch harbors from worker (cached for 1 hour at edge)
 */
export async function fetchHarborsFromWorker(language = "fi") {
  try {
    const url = `${WORKER_BASE_URL}/harbors?lang=${language}`
    console.log("Fetching harbors from worker:", url)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`Worker responded with status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`Fetched ${data.length} harbors from worker`)
    
    // Verify the response structure
    if (!Array.isArray(data)) {
      console.error("Worker returned non-array response:", data)
      throw new Error("Invalid response format from worker")
    }
    
    // Filter and transform the data to ensure correct language and proper hints
    const transformedData = data
      .filter(harbor => harbor.language === language)
      .map(harbor => {
        // Ensure the harbor has proper structure
        const transformedHarbor = {
          ...harbor,
          coordinates: harbor.coordinates || { lat: 0, lng: 0 },
          type: Array.isArray(harbor.type) ? harbor.type : [harbor.type || 'Marina'],
          region: harbor.region || 'Unknown',
          name: harbor.name || 'Unknown Harbor',
          description: harbor.description || '',
          notable_feature: harbor.notable_feature || ''
        }
        
        // Handle hints - check multiple possible sources
        if (harbor.hints && Array.isArray(harbor.hints) && harbor.hints.length > 0) {
          // Use existing hints if they exist and are valid
          transformedHarbor.hints = harbor.hints.slice(0, 5) // Limit to 5 hints
        } else if (harbor.harbor_hints && Array.isArray(harbor.harbor_hints)) {
          // Transform from harbor_hints structure
          transformedHarbor.hints = harbor.harbor_hints
            .sort((a, b) => (a.hint_order || 0) - (b.hint_order || 0))
            .map(hint => hint.hint_text || hint.text || hint)
            .filter(hint => hint && typeof hint === 'string')
            .slice(0, 5)
        } else {
          // Generate default hints based on harbor data
          transformedHarbor.hints = generateLanguageSpecificHints(transformedHarbor, language)
        }
        
        // Ensure we have exactly 5 hints
        while (transformedHarbor.hints.length < 5) {
          if (language === 'fi') {
            transformedHarbor.hints.push("Tämä satama on osa Suomen merenkululkuverkkoa")
          } else {
            transformedHarbor.hints.push("This harbor is part of Finland's maritime network")
          }
        }
        
        return transformedHarbor
      })
    
    console.log(`Transformed ${transformedData.length} harbors for language: ${language}`)
    
    if (transformedData.length === 0) {
      console.warn(`No harbors found for language: ${language}`)
      // Fallback: try to get any harbors and transform them
      const fallbackData = data.slice(0, 10).map(harbor => ({
        ...harbor,
        language: language, // Force the language
        hints: generateLanguageSpecificHints(harbor, language)
      }))
      
      if (fallbackData.length > 0) {
        console.log(`Using ${fallbackData.length} fallback harbors`)
        return fallbackData
      }
    }
    
    // Log sample harbor for debugging
    if (transformedData.length > 0) {
      console.log("Sample transformed harbor:", {
        id: transformedData[0].id,
        name: transformedData[0].name,
        language: transformedData[0].language,
        hintsCount: transformedData[0].hints?.length,
        hints: transformedData[0].hints
      })
    }
    
    return transformedData
  } catch (error) {
    console.error("Error fetching harbors from worker:", error)
    throw error
  }
}

/**
 * Generate language-specific hints for harbors
 */
function generateLanguageSpecificHints(harbor, language) {
  const hints = []
  
  if (language === 'fi') {
    // Finnish hints
    if (harbor.region) {
      hints.push(`Tämä satama sijaitsee alueella ${harbor.region}`)
    }
    if (harbor.type && Array.isArray(harbor.type) && harbor.type.length > 0) {
      hints.push(`Tämä on ${harbor.type[0].toLowerCase()} -tyyppinen satama`)
    }
    if (harbor.notable_feature) {
      hints.push(`Erikoispiirre: ${harbor.notable_feature}`)
    }
    if (harbor.name) {
      const firstLetter = harbor.name.charAt(0).toUpperCase()
      hints.push(`Sataman nimi alkaa kirjaimella "${firstLetter}"`)
    }
    if (harbor.description && harbor.description.length > 50) {
      const shortDesc = harbor.description.length > 120 
        ? harbor.description.substring(0, 120) + "..." 
        : harbor.description
      hints.push(shortDesc)
    } else {
      hints.push("Tämä on tärkeä satama Suomen rannikolla")
    }
  } else {
    // English hints
    if (harbor.region) {
      hints.push(`This harbor is located in ${harbor.region}`)
    }
    if (harbor.type && Array.isArray(harbor.type) && harbor.type.length > 0) {
      hints.push(`This is a ${harbor.type[0].toLowerCase()} type harbor`)
    }
    if (harbor.notable_feature) {
      hints.push(`Notable feature: ${harbor.notable_feature}`)
    }
    if (harbor.name) {
      const firstLetter = harbor.name.charAt(0).toUpperCase()
      hints.push(`The harbor name starts with "${firstLetter}"`)
    }
    if (harbor.description && harbor.description.length > 50) {
      const shortDesc = harbor.description.length > 120 
        ? harbor.description.substring(0, 120) + "..." 
        : harbor.description
      hints.push(shortDesc)
    } else {
      hints.push("This is an important harbor on Finland's coast")
    }
  }
  
  // Ensure we have at least 5 hints
  while (hints.length < 5) {
    if (language === 'fi') {
      hints.push("Tämä satama on osa Suomen merenkululkuverkkoa")
    } else {
      hints.push("This harbor is part of Finland's maritime network")
    }
  }
  
  return hints.slice(0, 5)
}

/**
 * Fetch trivia questions from worker (cached for 1 hour at edge)
 */
export async function fetchTriviaFromWorker(language = "fi") {
  try {
    const url = `${WORKER_BASE_URL}/trivia?lang=${language}`
    console.log("Fetching trivia from worker:", url)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`Worker responded with status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`Fetched ${data.length} trivia questions from worker`)
    
    // Filter by language and ensure proper structure
    const filteredData = data
      .filter(question => question.language === language)
      .map(question => ({
        ...question,
        correctAnswer: question.correct_answer !== undefined ? question.correct_answer : 0,
        answers: Array.isArray(question.answers) ? question.answers : [],
        explanation: question.explanation || 'No explanation available'
      }))
    
    console.log(`Filtered ${filteredData.length} trivia questions for language: ${language}`)
    
    return filteredData
  } catch (error) {
    console.error("Error fetching trivia from worker:", error)
    throw error
  }
}

/**
 * Check worker health
 */
export async function checkWorkerHealth() {
  try {
    const url = `${WORKER_BASE_URL}/health`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log("Worker health check:", data)
    
    return data
  } catch (error) {
    console.error("Worker health check failed:", error)
    throw error
  }
}

/**
 * Get worker info and available endpoints
 */
export async function getWorkerInfo() {
  try {
    const url = `${WORKER_BASE_URL}/`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Worker info failed with status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log("Worker info:", data)
    
    return data
  } catch (error) {
    console.error("Failed to get worker info:", error)
    throw error
  }
}