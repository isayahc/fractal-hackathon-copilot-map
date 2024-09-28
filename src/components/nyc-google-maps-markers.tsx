'use client'

import { useState, useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface MapMarker {
  id: number
  lat: number
  lng: number
  name: string
  description: string
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const markerIdCounter = useRef(0)

  const form = useForm({
    defaultValues: {
      name: '',
      description: ''
    }
  })

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setClickedLocation({
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      })
      setIsDialogOpen(true)
    }
  }

  const addMarker = (lat: number, lng: number, name: string, description: string) => {
    const newMarker: MapMarker = {
      id: markerIdCounter.current++,
      lat,
      lng,
      name: name || `NYC Location ${markerIdCounter.current}`,
      description
    }
    setMarkers(prevMarkers => [...prevMarkers, newMarker])
  }

  const removeMarker = (id: number) => {
    setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== id))
  }

  const onSubmit = (data: { name: string; description: string }) => {
    if (clickedLocation) {
      addMarker(clickedLocation.lat, clickedLocation.lng, data.name, data.description)
      setIsDialogOpen(false)
      form.reset()
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">New York City Map Markers</h1>
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
          <ul className="space-y-4">
            {markers.map(marker => (
              <li key={marker.id} className="bg-gray-100 p-4 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{marker.name}</h3>
                    <p className="text-sm text-gray-600">Lat: {marker.lat.toFixed(4)}, Lng: {marker.lng.toFixed(4)}</p>
                    <p className="mt-2">{marker.description}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => removeMarker(marker.id)}>Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter location description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {clickedLocation && (
                <div>
                  <p>Latitude: {clickedLocation.lat.toFixed(4)}</p>
                  <p>Longitude: {clickedLocation.lng.toFixed(4)}</p>
                </div>
              )}
              <DialogFooter>
                <Button type="submit">Add Marker</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { Component as NycGoogleMapsMarkers }