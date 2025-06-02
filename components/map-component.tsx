// // components/map-component.tsx

"use client"

import { useEffect, useRef, useState } from "react"
import { Anchor, Layers } from "lucide-react"
import "leaflet/dist/leaflet.css" // Import Leaflet CSS
import { useLanguage } from "@/contexts/language-context"

// This component uses Leaflet.js with OpenStreetMap
export default function MapComponent({
  selectedLocation = null,
  setSelectedLocation = null,
  actualLocation = null,
  harborName = null,
  showFinland = false,
  showHarborNames = false,
  harborData = [],
  searchedLocation = null,
}) {
  const { t } = useLanguage() || { t: (key) => key }
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const actualMarkerRef = useRef(null)
  const harborMarkersRef = useRef([])
  const searchMarkerRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapStyle, setMapStyle] = useState("standard") // Default to standard style
  const [showStyleDropdown, setShowStyleDropdown] = useState(false)

  // Finland's bounding box approximately
  const finlandBounds = [
    [59.7, 19.1], // Southwest corner
    [70.1, 31.6], // Northeast corner
  ]

  // Get map background color based on style
  const getMapBackgroundColor = (style) => {
    switch (style) {
      case "satellite":
        return "#000000" // Black for satellite
      case "terrain":
        return "#d8e8ef" // Light blue for terrain
      case "standard":
      default:
        return "#f2f2f2" // Light gray for standard
    }
  }

  // Get tile URL based on style
  const getTileUrl = (style) => {
    switch (style) {
      case "satellite":
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      case "terrain":
        return "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg"
      case "standard":
      default:
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    }
  }

  // Update map style
  const updateMapStyle = (map, L, style) => {
    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })

    // Update the map background color to match the tiles
    if (mapRef.current) {
      mapRef.current.style.backgroundColor = getMapBackgroundColor(style)
    }

    // Add new tile layer based on selected style
    const tileUrl = getTileUrl(style)
    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
  }

  // Load map
  const loadMap = async () => {
    try {
      // Check if window is defined (client-side)
      if (typeof window === "undefined") return

      // Import Leaflet
      const L = await import("leaflet")

      // Make sure we only initialize the map once and the ref exists
      if (mapInstanceRef.current || !mapRef.current) return

      // Set initial background color
      if (mapRef.current) {
        mapRef.current.style.backgroundColor = getMapBackgroundColor(mapStyle)
      }

      // Initialize the map
      const map = L.map(mapRef.current, {
        center: [64.0, 26.0], // Center of Finland
        zoom: 5,
        zoomControl: false, // Hide default zoom controls
      })

      // Add tile layer
      const tileUrl = getTileUrl(mapStyle)
      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add click handler to the map if setSelectedLocation is provided
      if (setSelectedLocation) {
        map.on("click", (e) => {
          if (setSelectedLocation) {
            setSelectedLocation({
              lat: e.latlng.lat,
              lng: e.latlng.lng,
            })
          }
        })
      }

      // Store the map instance
      mapInstanceRef.current = map

      setMapLoaded(true)
    } catch (error) {
      console.error("Error loading map:", error)
    }
  }

  useEffect(() => {
    // Import Leaflet dynamically (client-side only)
    const loadMapWrapper = async () => {
      await loadMap()
    }

    loadMapWrapper()

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [setSelectedLocation])

  // Function to change map style
  const changeMapStyle = (style) => {
    setMapStyle(style)

    if (mapInstanceRef.current) {
      import("leaflet")
        .then((L) => {
          updateMapStyle(mapInstanceRef.current, L, style)
        })
        .catch((error) => {
          console.error("Error updating map style:", error)
        })
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    if (showStyleDropdown) {
      const handleClickOutside = (event) => {
        if (!event.target.closest(".map-style-dropdown")) {
          setShowStyleDropdown(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showStyleDropdown])

  // Handle map style changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    const updateStyle = async () => {
      try {
        const L = await import("leaflet")
        updateMapStyle(mapInstanceRef.current, L, mapStyle)
      } catch (error) {
        console.error("Error updating map style:", error)
      }
    }

    updateStyle()
  }, [mapStyle, mapLoaded])

  // Handle harbor data to show names on the map
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !showHarborNames || !harborData || harborData.length === 0) return

    const loadHarborMarkers = async () => {
      try {
        const L = await import("leaflet")

        // Clear existing harbor markers
        harborMarkersRef.current.forEach((marker) => marker.remove())
        harborMarkersRef.current = []

        // Add markers for all harbors with names
        harborData.forEach((harbor) => {
          if (!harbor || !harbor.coordinates || !harbor.coordinates.lat || !harbor.coordinates.lng) {
            console.warn("Invalid harbor data:", harbor)
            return
          }

          // Create a custom icon for harbor markers
          const harborIcon = L.divIcon({
            html: `
              <div class="relative">
                <div class="absolute -top-3 -left-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md border border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a9 9 0 0 1 9 9h-4.5a4.5 4 0 0 0-9 0H3a9 9 0 0 1 9-9Z"></path>
                    <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"></path>
                  </svg>
                </div>
                <div class="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-md">
                  ${harbor.name || t("map.unknownHarbor")}
                </div>
              </div>
            `,
            className: "",
            iconSize: [0, 0],
          })

          // Add marker at harbor location
          const marker = L.marker([harbor.coordinates.lat, harbor.coordinates.lng], { icon: harborIcon }).addTo(
            mapInstanceRef.current,
          )

          // Add popup with harbor info
          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">${harbor.name || t("map.unknownHarbor")}</h3>
              <p class="text-xs mt-1">${harbor.region || t("map.unknownRegion")}</p>
              <p class="text-xs mt-1">${(harbor.type || []).join(", ") || t("map.unknownType")}</p>
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
      // Clean up harbor markers when component unmounts or dependencies change
      harborMarkersRef.current.forEach((marker) => marker.remove())
      harborMarkersRef.current = []
    }
  }, [mapLoaded, showHarborNames, harborData, t])

  // Handle selected location changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    const updateSelectedMarker = async () => {
      try {
        const L = await import("leaflet")

        // Remove existing marker if any
        if (markerRef.current) {
          markerRef.current.remove()
          markerRef.current = null
        }

        // Add new marker if location is selected
        if (selectedLocation) {
          // Create a custom icon for the guess marker with anchor symbol
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

          // Add marker at selected location
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

  // Handle actual location changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    const updateActualMarker = async () => {
      try {
        const L = await import("leaflet")

        // Remove existing actual marker if any
        if (actualMarkerRef.current) {
          actualMarkerRef.current.remove()
          actualMarkerRef.current = null
        }

        // Add new marker if actual location is provided
        if (actualLocation) {
          // Create a custom icon for the actual location marker
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

          // Add marker at actual location
          actualMarkerRef.current = L.marker([actualLocation.lat, actualLocation.lng], { icon: actualIcon }).addTo(
            mapInstanceRef.current,
          )

          // Draw line between guess and actual if both exist
          if (selectedLocation) {
            const line = L.polyline(
              [
                [selectedLocation.lat, selectedLocation.lng],
                [actualLocation.lat, actualLocation.lng],
              ],
              { color: "red", dashArray: "5, 10", weight: 2 },
            ).addTo(mapInstanceRef.current)

            // Zoom to fit both markers
            const bounds = L.latLngBounds(
              [selectedLocation.lat, selectedLocation.lng],
              [actualLocation.lat, actualLocation.lng],
            )
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
          } else {
            // Just zoom to the actual location
            mapInstanceRef.current.setView([actualLocation.lat, actualLocation.lng], 10)
          }
        }
      } catch (error) {
        console.error("Error updating actual marker:", error)
      }
    }

    updateActualMarker()
  }, [actualLocation, selectedLocation, harborName, mapLoaded, t])

  // Handle searched location changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !searchedLocation) return

    const updateSearchMarker = async () => {
      try {
        const L = await import("leaflet")

        // Remove existing search marker if any
        if (searchMarkerRef.current) {
          searchMarkerRef.current.remove()
          searchMarkerRef.current = null
        }

        // Zoom to the searched location (but not too close)
        mapInstanceRef.current.setView([searchedLocation.lat, searchedLocation.lng], 8)

        // Create a custom icon for the search marker
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

        // Add marker at searched location
        searchMarkerRef.current = L.marker([searchedLocation.lat, searchedLocation.lng], { icon: searchIcon }).addTo(
          mapInstanceRef.current,
        )

        // Add popup with location info
        searchMarkerRef.current
          .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${searchedLocation.name}</h3>
            <p class="text-xs mt-1">${t("map.searchedLocation")}</p>
          </div>
        `)
          .openPopup()

        // Auto-remove the search marker after 5 seconds
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

  // Force map resize when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="relative w-full h-[500px] bg-blue-50">
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

      {/* Custom map controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Zoom controls */}
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

        {/* Map style selector */}
        <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg shadow-lg map-style-dropdown">
          <div className="relative">
            <button
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md"
              aria-label={t("map.changeMapStyle")}
              onClick={() => setShowStyleDropdown(!showStyleDropdown)}
            >
              <Layers className="h-4 w-4" />
            </button>

            {/* Dropdown for map styles */}
            {showStyleDropdown && (
              <div className="absolute right-full mr-2 top-0">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 w-32">
                  <div className="flex flex-col gap-1">
                    <button
                      className={`text-xs text-left px-2 py-1.5 rounded ${
                        mapStyle === "standard"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                      onClick={() => {
                        changeMapStyle("standard")
                        setShowStyleDropdown(false)
                      }}
                    >
                      {t("map.standard")}
                    </button>
                    <button
                      className={`text-xs text-left px-2 py-1.5 rounded ${
                        mapStyle === "satellite"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                      onClick={() => {
                        changeMapStyle("satellite")
                        setShowStyleDropdown(false)
                      }}
                    >
                      {t("map.satellite")}
                    </button>
                    <button
                      className={`text-xs text-left px-2 py-1.5 rounded ${
                        mapStyle === "terrain"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                      onClick={() => {
                        changeMapStyle("terrain")
                        setShowStyleDropdown(false)
                      }}
                    >
                      {t("map.terrain")}
                    </button>
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
