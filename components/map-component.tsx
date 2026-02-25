// components/map-component.tsx
"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import { Anchor, Layers } from "lucide-react"
import "leaflet/dist/leaflet.css"
import { useLanguage } from "@/contexts/language-context"

const MapComponent = forwardRef(({
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
}, ref) => {
  const { t } = useLanguage() || { t: (key) => key }
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const actualMarkerRef = useRef(null)
  const lineRef = useRef(null)
  const harborMarkersRef = useRef([])
  const searchMarkerRef = useRef(null)
  const guessMarkersRef = useRef([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapStyle, setMapStyle] = useState("standard")
  const [showStyleDropdown, setShowStyleDropdown] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Ref so click handler always reads latest setter without remounting the map
  const setSelectedLocationRef = useRef(setSelectedLocation)
  useEffect(() => {
    setSelectedLocationRef.current = setSelectedLocation
  }, [setSelectedLocation])

  const mapStyles = {
    standard: {
      tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "",
      backgroundColor: "#f2f2f2",
    },
    satellite: {
      tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "",
      backgroundColor: "#000000",
    },
  }

  // Function to reset map view to show all of Finland
  const resetMapView = () => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.setView([64.0, 26.0], 5)
  }

  // Expose the reset function to parent component
  useImperativeHandle(ref, () => ({
    resetMapView
  }))

  const updateMapStyle = (map, L, style) => {
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer)
    })
    if (mapRef.current) {
      mapRef.current.style.backgroundColor = mapStyles[style].backgroundColor
    }
    L.tileLayer(mapStyles[style].tileUrl, {
      attribution: mapStyles[style].attribution,
      maxZoom: 19,
      noWrap: true,
    }).addTo(map)
  }

  // ── Initialize map ONCE ───────────────────────────────────────────────────
  useEffect(() => {
    const loadMap = async () => {
      try {
        if (typeof window === "undefined") return
        const L = await import("leaflet")
        if (mapInstanceRef.current || !mapRef.current) return

        if (mapRef.current) {
          mapRef.current.style.backgroundColor = mapStyles[mapStyle].backgroundColor
        }

        const map = L.map(mapRef.current, {
          center: [64.0, 26.0],
          zoom: 5,
          zoomControl: false,
          attributionControl: false,
        })

        L.tileLayer(mapStyles[mapStyle].tileUrl, {
          attribution: mapStyles[mapStyle].attribution,
          maxZoom: 19,
          noWrap: true,
        }).addTo(map)

        map.on("click", (e) => {
          if (setSelectedLocationRef.current) {
            setSelectedLocationRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
          }
        })

        mapInstanceRef.current = map
        setMapLoaded(true)
      } catch (error) {
        console.error("Error loading map:", error)
      }
    }

    loadMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, []) // empty — map initializes once, never remounts

  // ── Map style ─────────────────────────────────────────────────────────────
  const changeMapStyle = (style) => {
    setMapStyle(style)
    setShowStyleDropdown(false)
    if (mapInstanceRef.current) {
      import("leaflet").then((L) => updateMapStyle(mapInstanceRef.current, L, style))
    }
  }

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return
    import("leaflet").then((L) => updateMapStyle(mapInstanceRef.current, L, mapStyle))
  }, [mapStyle, mapLoaded])

  // ── Full-screen ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return
    if (isFullScreen) {
      document.body.style.overflow = "hidden"
      if (mapRef.current) mapRef.current.style.zIndex = "1000"
    } else {
      document.body.style.overflow = "auto"
      if (mapRef.current) mapRef.current.style.zIndex = "10"
    }
    mapInstanceRef.current.invalidateSize()
  }, [isFullScreen])

  // ── Dropdown outside-click ────────────────────────────────────────────────
  useEffect(() => {
    if (!showStyleDropdown) return
    const handler = (e) => {
      if (!e.target.closest(".map-style-dropdown")) setShowStyleDropdown(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showStyleDropdown])

  // ── Selected location marker (red pin) ───────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return
    const update = async () => {
      try {
        const L = await import("leaflet")
        if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
        if (!selectedLocation) return

        // If showHarborNames is on and this matches a known harbor,
        // skip the red pin — the harbor marker itself shows the highlight
        if (showHarborNames && harborData?.length) {
          const matchesHarbor = harborData.some(
            (h) =>
              h?.coordinates &&
              Math.abs(h.coordinates.lat - selectedLocation.lat) < 0.0001 &&
              Math.abs(h.coordinates.lng - selectedLocation.lng) < 0.0001
          )
          if (matchesHarbor) return
        }

        const icon = L.divIcon({
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
            </div>`,
          className: "",
          iconSize: [0, 0],
        })
        markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], { icon }).addTo(mapInstanceRef.current)
      } catch (err) {
        console.error("Error updating selected marker:", err)
      }
    }
    update()
  }, [selectedLocation, mapLoaded, showHarborNames, harborData, t])

  // ── Actual harbor marker + line (only shown AFTER guessing) ──────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return
    const update = async () => {
      try {
        const L = await import("leaflet")
        if (actualMarkerRef.current) { actualMarkerRef.current.remove(); actualMarkerRef.current = null }
        if (lineRef.current) { lineRef.current.remove(); lineRef.current = null }
        if (!actualLocation) return

        const icon = L.divIcon({
          html: `
            <div class="relative">
              <div class="absolute -top-5 -left-5 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a9 9 0 0 1 9 9h-4.5a4.5 4.5 0 0 0-9 0H3a9 9 0 0 1 9-9Z"></path>
                  <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"></path>
                </svg>
              </div>
              <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap shadow-lg">
                ${harborName || t("locationGame.actualLocation")}
              </div>
            </div>`,
          className: "",
          iconSize: [0, 0],
        })

        actualMarkerRef.current = L.marker([actualLocation.lat, actualLocation.lng], { icon }).addTo(mapInstanceRef.current)

        if (selectedLocation) {
          lineRef.current = L.polyline(
            [[selectedLocation.lat, selectedLocation.lng], [actualLocation.lat, actualLocation.lng]],
            { color: "red", dashArray: "5, 10", weight: 2 }
          ).addTo(mapInstanceRef.current)

          const bounds = L.latLngBounds(
            [selectedLocation.lat, selectedLocation.lng],
            [actualLocation.lat, actualLocation.lng]
          )
          mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] })
        } else {
          mapInstanceRef.current.setView([actualLocation.lat, actualLocation.lng], 10)
        }
      } catch (err) {
        console.error("Error updating actual marker:", err)
      }
    }
    update()
  }, [actualLocation, selectedLocation, harborName, mapLoaded, t])

  // ── Harbor name markers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !showHarborNames || !harborData?.length) return
    const update = async () => {
      try {
        const L = await import("leaflet")
        harborMarkersRef.current.forEach((m) => m.remove())
        harborMarkersRef.current = []

        harborData.forEach((harbor) => {
          if (!harbor?.coordinates?.lat || !harbor?.coordinates?.lng) return

          // Is this harbor the player's current guess selection?
          const isSelected =
            selectedLocation &&
            Math.abs(harbor.coordinates.lat - selectedLocation.lat) < 0.0001 &&
            Math.abs(harbor.coordinates.lng - selectedLocation.lng) < 0.0001

          // All unselected harbors use the same neutral blue
          const color = isSelected ? "#ef4444" : "#2563eb"

          const icon = L.divIcon({
            html: isSelected ? `
              <div class="relative" style="cursor:pointer">
                <div class="absolute -top-5 -left-5 w-10 h-10 bg-red-500 rounded-full animate-ping opacity-40"></div>
                <div class="absolute -top-5 -left-5 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="background-color:${color}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="5" r="3"></circle>
                    <line x1="12" y1="22" x2="12" y2="8"></line>
                    <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
                  </svg>
                </div>
                <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-md" style="background-color:${color}">
                  ✓ ${harbor.name}
                </div>
              </div>` : `
              <div class="relative" style="cursor:pointer">
                <div class="absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md border border-white" style="background-color:${color}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 3a9 9 0 0 1 9 9h-4.5a4.5 4.5 0 0 0-9 0H3a9 9 0 0 1 9-9Z"/>
                    <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/>
                  </svg>
                </div>
                <div class="absolute -top-9 left-1/2 transform -translate-x-1/2 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-md" style="background-color:${color}">
                  ${harbor.name}
                </div>
              </div>`,
            className: "",
            iconSize: [0, 0],
          })

          const marker = L.marker([harbor.coordinates.lat, harbor.coordinates.lng], { icon })
            .addTo(mapInstanceRef.current)

          // Clicking a harbor marker selects it as the guess
          marker.on("click", (e) => {
            L.DomEvent.stopPropagation(e)
            if (setSelectedLocationRef.current) {
              setSelectedLocationRef.current({
                lat: harbor.coordinates.lat,
                lng: harbor.coordinates.lng,
              })
            }
          })

          harborMarkersRef.current.push(marker)
        })
      } catch (err) {
        console.error("Error loading harbor markers:", err)
      }
    }
    update()
    return () => { harborMarkersRef.current.forEach((m) => m.remove()); harborMarkersRef.current = [] }
  }, [mapLoaded, showHarborNames, harborData, selectedLocation, t])

  // ── Game history markers ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !gameHistory?.length) return
    const update = async () => {
      try {
        const L = await import("leaflet")
        guessMarkersRef.current.forEach((m) => m.remove())
        guessMarkersRef.current = []

        gameHistory.forEach((guess, index) => {
          const lat = guess.selectedLocation?.lat
          const lng = guess.selectedLocation?.lng
          if (!lat || !lng) return

          const color = guess.correct ? "#10b981" : `hsl(${(index * 60) % 360}, 70%, 50%)`
          const icon = L.divIcon({
            html: `
              <div class="relative">
                <div class="absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="background-color:${color}">
                  <span class="text-white text-xs font-bold">${index + 1}</span>
                </div>
                <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white px-1 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-md" style="background-color:${color}">
                  ${guess.correct ? t("locationGame.correct") : `${Math.round(guess.distance)}km`}
                </div>
              </div>`,
            className: "",
            iconSize: [0, 0],
          })
          const marker = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current)
          guessMarkersRef.current.push(marker)
        })
      } catch (err) {
        console.error("Error loading history markers:", err)
      }
    }
    update()
    return () => { guessMarkersRef.current.forEach((m) => m.remove()); guessMarkersRef.current = [] }
  }, [mapLoaded, gameHistory, t])

  // ── Searched location (purple pin + pan) ─────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !searchedLocation) return
    const update = async () => {
      try {
        const L = await import("leaflet")
        if (searchMarkerRef.current) { searchMarkerRef.current.remove(); searchMarkerRef.current = null }

        mapInstanceRef.current.setView([searchedLocation.lat, searchedLocation.lng], 8)

        // If showHarborNames is on, harbor marker already highlights — just pan, skip extra pin
        if (showHarborNames) return

        const icon = L.divIcon({
          html: `
            <div class="relative">
              <div class="absolute -top-4 -left-4 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <div class="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-md">
                ${searchedLocation.name || ""}
              </div>
            </div>`,
          className: "",
          iconSize: [0, 0],
        })

        searchMarkerRef.current = L.marker([searchedLocation.lat, searchedLocation.lng], { icon }).addTo(mapInstanceRef.current)
        setTimeout(() => {
          if (searchMarkerRef.current) { searchMarkerRef.current.remove(); searchMarkerRef.current = null }
        }, 5000)
      } catch (err) {
        console.error("Error updating search marker:", err)
      }
    }
    update()
  }, [searchedLocation, mapLoaded, showHarborNames, t])

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => mapInstanceRef.current?.invalidateSize()
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`relative w-full ${isFullScreen ? "fixed inset-0 z-50" : "h-[500px]"} bg-blue-50`}>
      <div ref={mapRef} className="w-full h-full z-10" />

      {!selectedLocation && !actualLocation && setSelectedLocationRef.current && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 p-3 rounded-lg text-center z-20 shadow-lg">
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <p className="text-slate-800 dark:text-white text-sm font-medium">{t("map.clickToSelect")}</p>
          </div>
        </div>
      )}

      {selectedLocation && !actualLocation && (
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-red-500 text-white text-xs font-medium py-1.5 px-3 rounded-full shadow-md">
            ✓ {t("map.locationSelected")}
          </div>
        </div>
      )}

      {gameHistory?.length > 0 && (
        <div className="absolute bottom-4 left-4 z-20">
          <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg shadow-lg text-xs">
            <p className="font-medium text-slate-800 dark:text-white mb-1">{t("locationGame.previousGuesses")}:</p>
            <div className="flex gap-1">
              {gameHistory.slice(0, 5).map((guess, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: guess.correct ? "#10b981" : `hsl(${(index * 60) % 360}, 70%, 50%)` }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zoom + layer controls */}
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
})

MapComponent.displayName = "MapComponent"

export default MapComponent