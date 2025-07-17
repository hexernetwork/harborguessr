// lib/game-state-manager.js
/**
 * Game State Manager for persisting location game progress
 * Handles saving/loading game state to/from localStorage
 */

const GAME_STATE_KEY = 'harbor_location_game_state'
const GAME_DATA_KEY = 'harbor_location_game_data'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Game state structure
 */
const defaultGameState = {
  currentHarbor: null,
  harbors: [],
  score: 0,
  round: 1,
  guessCount: 0,
  currentHintIndex: 0,
  gameOver: false,
  correctGuess: false,
  selectedLocation: null,
  distance: null,
  gameStarted: false,
  sessionId: null,
  language: 'fi',
  lastSaved: null
}

/**
 * Check if we're in browser environment
 */
const isBrowser = typeof window !== 'undefined'

/**
 * Save game state to localStorage
 */
export function saveGameState(gameState) {
  if (!isBrowser) return false
  
  try {
    const stateToSave = {
      ...gameState,
      lastSaved: Date.now()
    }
    
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateToSave))
    console.log('Game state saved to localStorage:', stateToSave)
    return true
  } catch (error) {
    console.error('Failed to save game state:', error)
    return false
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameState() {
  if (!isBrowser) return null
  
  try {
    const savedState = localStorage.getItem(GAME_STATE_KEY)
    if (!savedState) return null
    
    const parsedState = JSON.parse(savedState)
    console.log('Game state loaded from localStorage:', parsedState)
    
    // Check if state is not too old (24 hours)
    if (parsedState.lastSaved && Date.now() - parsedState.lastSaved > 24 * 60 * 60 * 1000) {
      console.log('Game state is too old, clearing it')
      clearGameState()
      return null
    }
    
    return parsedState
  } catch (error) {
    console.error('Failed to load game state:', error)
    return null
  }
}

/**
 * Clear game state from localStorage
 */
export function clearGameState() {
  if (!isBrowser) return
  
  try {
    localStorage.removeItem(GAME_STATE_KEY)
    localStorage.removeItem(GAME_DATA_KEY)
    console.log('Game state cleared from localStorage')
  } catch (error) {
    console.error('Failed to clear game state:', error)
  }
}

/**
 * Save harbor data to localStorage with cache expiration
 */
export function saveHarborData(harbors, language) {
  if (!isBrowser) return false
  
  try {
    const dataToSave = {
      harbors,
      language,
      cachedAt: Date.now()
    }
    
    localStorage.setItem(GAME_DATA_KEY, JSON.stringify(dataToSave))
    console.log(`Cached ${harbors.length} harbors for language: ${language}`)
    return true
  } catch (error) {
    console.error('Failed to save harbor data:', error)
    return false
  }
}

/**
 * Load cached harbor data from localStorage
 */
export function loadCachedHarborData(language) {
  if (!isBrowser) return null
  
  try {
    const cachedData = localStorage.getItem(GAME_DATA_KEY)
    if (!cachedData) return null
    
    const parsedData = JSON.parse(cachedData)
    
    // Check if cache is valid (1 hour) and language matches
    if (
      parsedData.language === language &&
      parsedData.cachedAt &&
      Date.now() - parsedData.cachedAt < CACHE_DURATION
    ) {
      console.log(`Using cached harbor data for language: ${language}`)
      return parsedData.harbors
    } else {
      console.log('Cached harbor data is stale or wrong language')
      return null
    }
  } catch (error) {
    console.error('Failed to load cached harbor data:', error)
    return null
  }
}

/**
 * Check if there's a saved game in progress
 */
export function hasSavedGame() {
  const savedState = loadGameState()
  return savedState && savedState.gameStarted && savedState.round > 1
}

/**
 * Create a fresh game state
 */
export function createFreshGameState(language = 'fi') {
  return {
    ...defaultGameState,
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    language
  }
}

/**
 * Update specific game state properties
 */
export function updateGameState(updates) {
  const currentState = loadGameState() || createFreshGameState()
  const newState = { ...currentState, ...updates }
  saveGameState(newState)
  return newState
}

/**
 * Get game statistics for debugging
 */
export function getGameStats() {
  if (!isBrowser) return null
  
  const gameState = loadGameState()
  const harborData = loadCachedHarborData(gameState?.language || 'fi')
  
  return {
    hasGameState: !!gameState,
    hasCachedData: !!harborData,
    gameRound: gameState?.round || 0,
    gameScore: gameState?.score || 0,
    harborsCount: harborData?.length || 0,
    language: gameState?.language || 'unknown',
    lastSaved: gameState?.lastSaved || null
  }
}

/**
 * Debug localStorage contents
 */
export function debugLocalStorage() {
  if (!isBrowser) {
    console.log('Not in browser environment')
    return
  }
  
  console.group('LocalStorage Debug')
  try {
    console.log('Game state:', localStorage.getItem(GAME_STATE_KEY))
    console.log('Harbor data:', localStorage.getItem(GAME_DATA_KEY))
    console.log('Language setting:', localStorage.getItem('language'))
    console.log('Storage usage:', JSON.stringify(localStorage).length + ' characters')
    
    // List all game-related keys
    const gameKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.includes('game') || key.includes('harbor') || key.includes('language')) {
        gameKeys.push(key)
      }
    }
    console.log('Game-related keys:', gameKeys)
    
  } catch (error) {
    console.error('LocalStorage error:', error)
  }
  console.groupEnd()
}

/**
 * Auto-save game state hook-like function
 */
export function createAutoSaver(intervalMs = 5000) {
  if (!isBrowser) return null
  
  let gameStateRef = null
  
  const saveIfChanged = () => {
    // This would be called by the component to register current state
    if (gameStateRef) {
      saveGameState(gameStateRef)
    }
  }
  
  const interval = setInterval(saveIfChanged, intervalMs)
  
  return {
    updateState: (newState) => {
      gameStateRef = newState
    },
    stop: () => {
      clearInterval(interval)
    }
  }
}