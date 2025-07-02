"use client"

import { useEffect, useRef, useState } from "react"
import { Anchor, Layers, X } from "lucide-react"
import "leaflet/dist/leaflet.css"
import { useLanguage } from "@/contexts/language-context"

// This component uses Leaflet.js with OpenStreetMap or Esri satellite
export default function MapComponent({
  selectedLocation = null,
  setSelectedLocation = null,
  actualLocation = null,
  harborName = null,
  showFinland = false,
  showHarborNames = false,
  harborData = [],
  searchedLocation = null,
  gameHistory = [],
  currentHarbor = null,
}) {
  const { t } = useLanguage() || { t: (key) => key }
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const actualMarkerRef = useRef(null)
  const harborMarkersRef = useRef([])
  const searchMarkerRef = useRef(null)
  const guessMarkersRef = useRef([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapStyle, setMapStyle] = useState("standard") // Default to satellite?
  const [showStyleDropdown, setShowStyleDropdown] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Finland's bounding box
  const finlandBounds = [
    [59.7, 19.1], // Southwest
    [70.1, 31.6], // Northeast
  ]

  // Map style configurations
  const mapStyles = {
    standard: {
      tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '', // Empty to hide attribution
      backgroundColor: "#f2f2f2",
    },
    satellite: {
      tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '', // Empty to hide attribution
      backgroundColor: "#000000",
    },
  }

  // Update map style
  const updateMapStyle = (map, L, style) => {
    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })

    // Update background color
    if (mapRef.current) {
      mapRef.current.style.backgroundColor = mapStyles[style].backgroundColor
    }

    // Add new tile layer
    L.tileLayer(mapStyles[style].tileUrl, {
      attribution: mapStyles[style].attribution,
      maxZoom: 19,
      noWrap: true,
    }).addTo(map)
  }

  // Toggle full-screen
  const toggleFullScreen = () => {
    if (!mapInstanceRef.current) return
    setIsFullScreen(!isFullScreen)
    setTimeout(() => {
      mapInstanceRef.current.invalidateSize()
    }, 100)
  }

  // Load map
  const loadMap = async () => {
    try {
      if (typeof window === "undefined") return

      const L = await import("leaflet")

      if (mapInstanceRef.current || !mapRef.current) return

      // Set initial background color
      if (mapRef.current) {
        mapRef.current.style.backgroundColor = mapStyles[mapStyle].backgroundColor
      }

      // Initialize map
      const map = L.map(mapRef.current, {
        center: [64.0, 26.0], // Center of Finland
        zoom: 5,
        zoomControl: false,
        attributionControl: false, // Hide attribution control
      })

      // Add tile layer
      L.tileLayer(mapStyles[mapStyle].tileUrl, {
        attribution: mapStyles[mapStyle].attribution,
        maxZoom: 19,
        noWrap: true,
      }).addTo(map)

      // Add click handler
      if (setSelectedLocation) {
        map.on("click", (e) => {
          setSelectedLocation({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          })
        })
      }

      mapInstanceRef.current = map
      setMapLoaded(true)
    } catch (error) {
      console.error("Error loading map:", error)
    }
  }

  useEffect(() => {
    loadMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [setSelectedLocation])

  // Change map style
  const changeMapStyle = (style) => {
    setMapStyle(style)
    setShowStyleDropdown(false)

    if (mapInstanceRef.current) {
      import("leaflet").then((L) => {
        updateMapStyle(mapInstanceRef.current, L, style)
      }).catch((error) => {
        console.error("Error updating map style:", error)
      })
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (showStyleDropdown) {
      const handleClickOutside = (event) => {
        if (!event.target.closest(".map-style-dropdown")) {
          setShowStyleDropdown(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showStyleDropdown])

  // Handle map style changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    import("leaflet").then((L) => {
      updateMapStyle(mapInstanceRef.current, L, mapStyle)
    }).catch((error) => {
      console.error("Error updating map style:", error)
    })
  }, [mapStyle, mapLoaded])

  // Handle full-screen state
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (isFullScreen) {
      document.body.style.overflow = 'hidden'
      mapRef.current.style.zIndex = '1000'
    } else {
      document.body.style.overflow = 'auto'
      mapRef.current.style.zIndex = '10'
    }

    mapInstanceRef.current.invalidateSize()
  }, [isFullScreen])

  // Handle game history
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !gameHistory || gameHistory.length === 0) return

    const loadGameHistoryMarkers = async () => {
      try {
        const L = await import("leaflet")

        guessMarkersRef.current.forEach((marker) => marker.remove())
        guessMarkersRef.current = []

        gameHistory.forEach((guess, index) => {
          if (!guess.selectedLocation) return

          const lat = guess.selectedLocation?.lat || guess.lat
          const lng = guess.selectedLocation?.lng || guess.lng

          if (!lat || !lng) {
            console.warn("Invalid guess location:", guess)
            return
          }

          const isCorrect = guess.correct
          const attemptNumber = index + 1
          const color = isCorrect ? '#10b981' : `hsl(${(attemptNumber * 60) % 360}, 70%, 50%)`

          const guessIcon = L.divIcon({
            html: `
              <div class="relative">
                <div class="absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${color}">
                  <span class="text-white text-xs font-bold">${attemptNumber}</span>
                </div>
                <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white px-1 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-md" style="background-color: ${color}">
                  ${isCorrect ? t("locationGame.correct") : `${Math.round(guess.distance)}km`}
                </div>
              </div>
            `,
            className: "",
            iconSize: [0, 0],
          })

          const marker = L.marker([lat, lng], { icon: guessIcon }).addTo(mapInstanceRef.current)
          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">${t("locationGame.guess")} ${attemptNumber}</h3>
              <p class="text-xs mt-1">${t("locationGame.distance")}: ${Math.round(guess.distance)}km</p>
            </div>
          `)
          guessMarkersRef.current.push(marker)
        })

        console.log(`Added ${guessMarkersRef.current.length} guess markers to map`)
      } catch (error) {
        console.error("Error loading game history markers:", error)
      }
    }

    loadGameHistoryMarkers()

    return () => {
      guessMarkersRef.current.forEach((marker) => marker.remove())
      guessMarkersRef.current = []
    }
  }, [mapLoaded, gameHistory, t])

  // Handle harbor data
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !showHarborNames || !harborData || harborData.length === 0) return

    const loadHarborMarkers = async () => {
      try {
        const L = await import("leaflet")

        harborMarkersRef.current.forEach((marker) => marker.remove())
        harborMarkersRef.current = []

        harborData.forEach((harbor) => {
          if (!harbor || !harbor.coordinates || !harbor.coordinates.lat || !harbor.coordinates.lng) {
            console.warn("Invalid harbor data:", harbor)
            return
          }

          const isCurrentHarbor = currentHarbor && harbor.id === currentHarbor.id
          const markerColor = isCurrentHarbor ? '#f59e0b' : '#2563eb'

          const harborIcon = L.divIcon({
            html: `
              <div class="relative">
                <div class="absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md border border-white" style="background-color: ${markerColor}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a9 9 0 0 1 9 9h-4.5a4.5 4 0 0 0-9 0H3a9 9 0 0 1 9-9Z"></path>
                    <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"></path>
                  </svg>
                </div>
                <div class="absolute -top-9 left-1/2 transform -translate-x-1/2 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-md" style="background-color: ${markerColor}">
                  ${harbor.name || t("map.unknownHarbor")}${isCurrentHarbor ? ' ⭐' : ''}
                </div>
              </div>
            `,
            className: "",
            iconSize: [0, 0],
          })

          const marker = L.marker([harbor.coordinates.lat, harbor.coordinates.lng], { icon: harborIcon }).addTo(
            mapInstanceRef.current,
          )

          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">${harbor.name || t("map.unknownHarbor")}${isCurrentHarbor ? ' ⭐' : ''}</h3>
              <p class="text-xs mt-1">${harbor.region || t("map.unknownRegion")}</p>
              <p class="text-xs mt-1">${(harbor.type || []).join(", ") || t("map.unknownType")}</p>
              ${isCurrentHarbor ? '<p class="text-xs mt-1 font-bold text-amber-600">Current target</p>' : ''}
            </div>
          `)

          harborMarkersRef.current.push(marker)
        })
      } catch (error) {
        console.error("Error loading harbor markers:", error)
      }
    }

    loadHarborMarkers()

    return () => {
      harborMarkersRef.current.forEach((marker) => marker.remove())
      harborMarkersRef.current = []
    }
  }, [mapLoaded, showHarborNames, harborData, currentHarbor, t])

  // Handle selected location
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    const updateSelectedMarker = async () => {
      try {
        const L = await import("leaflet")

        if (markerRef.current) {
          markerRef.current.remove()
          markerRef.current = null
        }

        if (selectedLocation) {
          const guessIcon = L.divIcon({
            html: `
              <div class="relative">
                <div class="absolute -top-4 -left-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5" r="3"></circle>
                    <line x1="12" y1="22" x2="12" y2="8"></line>
                    <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
                  </svg>
                </div>
                <div class="absolute -top-4 -left-4 w-8 h-8 bg-red-500 rounded-full animate-ping opacity-50"></div>
                <div class="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-md">
                  ${t("locationGame.yourGuess")}
                </div>
              </div>
            `,
            className: "",
            iconSize: [0, 0],
          })

          markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: guessIcon }).addTo(
            mapInstanceRef.current,
          )
        }
      } catch (error) {
        console.error("Error updating selected marker:", error)
      }
    }

    updateSelectedMarker()
  }, [selectedLocation, mapLoaded, t])

  // Handle actual location
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    const updateActualMarker = async () => {
      try {
        const L = await import("leaflet")

        if (actualMarkerRef.current) {
          actualMarkerRef.current.remove()
          actualMarkerRef.current = null
        }

        if (actualLocation) {
          const actualIcon = L.divIcon({
            html: `
              <div class="relative">
                <div class="absolute -top-5 -left-5 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a9 9 0 0 1 9 9h-4.5a4.5 4 0 0 0-9 0H3a9 9 0 0 1 9-9Z"></path>
                    <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"></path>
                  </svg>
                </div>
                <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap shadow-lg">
                  ${harborName || t("locationGame.actualLocation")}
                </div>
              </div>
            `,
            className: "",
            iconSize: [0, 0],
          })

          actualMarkerRef.current = L.marker([actualLocation.lat, actualLocation.lng], { icon: actualIcon }).addTo(
            mapInstanceRef.current,
          )

          if (selectedLocation) {
            const line = L.polyline(
              [
                [selectedLocation.lat, selectedLocation.lng],
                [actualLocation.lat, actualLocation.lng],
              ],
              { color: "red", dashArray: "5, 10", weight: 2 },
            ).addTo(mapInstanceRef.current)

            const bounds = L.latLngBounds(
              [selectedLocation.lat, selectedLocation.lng],
              [actualLocation.lat, actualLocation.lng],
            )
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
          } else {
            mapInstanceRef.current.setView([actualLocation.lat, actualLocation.lng], 10)
          }
        }
      } catch (error) {
        console.error("Error updating actual marker:", error)
      }
    }

    updateActualMarker()
  }, [actualLocation, selectedLocation, harborName, mapLoaded, t])

  // Handle searched location
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !searchedLocation) return

    const updateSearchMarker = async () => {
      try {
        const L = await import("leaflet")

        if (searchMarkerRef.current) {
          searchMarkerRef.current.remove()
          searchMarkerRef.current = null
        }

        mapInstanceRef.current.setView([searchedLocation.lat, searchedLocation.lng], 8)

        const searchIcon = L.divIcon({
          html: `
            <div class="relative">
              <div class="absolute -top-4 -left-4 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <div class="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-md">
                ${searchedLocation.name || t("map.searchedLocation")}
              </div>
            </div>
          `,
          className: "",
          iconSize: [0, 0],
        })

        searchMarkerRef.current = L.marker([searchedLocation.lat, searchedLocation.lng], { icon: searchIcon }).addTo(
          mapInstanceRef.current,
        )

        searchMarkerRef.current
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">${searchedLocation.name}</h3>
              <p class="text-xs mt-1">${t("map.searchedLocation")}</p>
            </div>
          `)
          .openPopup()

        setTimeout(() => {
          if (searchMarkerRef.current) {
            searchMarkerRef.current.remove()
            searchMarkerRef.current = null
          }
        }, 5000)
      } catch (error) {
        console.error("Error updating search marker:", error)
      }
    }

    updateSearchMarker()
  }, [searchedLocation, mapLoaded, t])

  // Force map resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className={`relative w-full ${isFullScreen ? 'fixed inset-0 z-50' : 'h-[500px]'} bg-blue-50`}>
      <div ref={mapRef} className="w-full h-full z-10"></div>

      {!selectedLocation && !actualLocation && setSelectedLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 p-3 rounded-lg text-center z-20 shadow-lg">
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <p className="text-slate-800 dark:text-white text-sm font-medium">{t("map.clickToSelect")}</p>
          </div>
        </div>
      )}

      {selectedLocation && !actualLocation && (
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-blue-600 text-white text-xs font-medium py-1.5 px-3 rounded-full shadow-md">
            {t("map.locationSelected")}
          </div>
        </div>
      )}

      {gameHistory && gameHistory.length > 0 && (
        <div className="absolute bottom-4 left-4 z-20">
          <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg shadow-lg text-xs">
            <p className="font-medium text-slate-800 dark:text-white mb-1">{t("locationGame.previousGuesses")}:</p>
            <div className="flex gap-1">
              {gameHistory.slice(0, 5).map((guess, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: guess.correct ? '#10b981' : `hsl(${(index * 60) % 360}, 70%, 50%)` }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg shadow-lg">
          <div className="flex flex-col gap-2">
            <button
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              aria-label={t("map.zoomIn")}
            >
              <span className="text-xl font-bold">+</span>
            </button>
            <button
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              aria-label={t("map.zoomOut")}
            >
              <span className="text-xl font-bold">-</span>
            </button>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg shadow-lg map-style-dropdown">
          <div className="relative">
            <button
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md"
              aria-label={t("map.changeMapStyle")}
              onClick={() => setShowStyleDropdown(!showStyleDropdown)}
            >
              <Layers className="h-4 w-4" />
            </button>

            {showStyleDropdown && (
              <div className="absolute top-0 right-full mr-2">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 w-32">
                  <div className="flex flex-col gap-1">
                    {Object.keys(mapStyles).map((style) => (
                      <button
                        key={style}
                        className={`text-xs text-left px-2 py-1.5 rounded ${
                          mapStyle === style
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                        onClick={() => changeMapStyle(style)}
                      >
                        {t(`map.${style}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}