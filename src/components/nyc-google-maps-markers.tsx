'use client'

import { useState, useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface MapMarker {
  id: number
  lat: number
  lng: number
  name: string
}

const mapContainerStyle = {
  width: '100%',
  height: '500px'
}

const nycCenter = {
  lat: 40.7128,
  lng: -74.0060
}

export default function Component() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [markerName, setMarkerName] = useState('')
  const markerIdCounter = useRef(0)

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newMarker: MapMarker = {
        id: markerIdCounter.current++,
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        name: markerName || `NYC Location ${markerIdCounter.current}`
      }
      setMarkers(prevMarkers => [...prevMarkers, newMarker])
      setMarkerName('')
    }
  }

  const removeMarker = (id: number) => {
    setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== id))
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">New York City Map Markers</h1>
      <div className="mb-4">
        <Label htmlFor="markerName">Location Name</Label>
        <Input
          id="markerName"
          value={markerName}
          onChange={(e) => setMarkerName(e.target.value)}
          placeholder="Enter location name"
          className="mt-1"
        />
      </div>
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={nycCenter}
          zoom={10}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
        >
          {markers.map(marker => (
            <Marker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              title={marker.name}
            />
          ))}
        </GoogleMap>
      ) : (
        <div className="h-[500px] flex items-center justify-center bg-gray-100">
          <p className="text-lg">Loading map...</p>
        </div>
      )}
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Marked Locations in NYC:</h2>
        {markers.length === 0 ? (
          <p>No locations marked yet. Click on the map to add markers.</p>
        ) : (
          <ul className="space-y-2">
            {markers.map(marker => (
              <li key={marker.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                <span>{marker.name} (Lat: {marker.lat.toFixed(4)}, Lng: {marker.lng.toFixed(4)})</span>
                <Button variant="destructive" size="sm" onClick={() => removeMarker(marker.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export { Component as NycGoogleMapsMarkers }