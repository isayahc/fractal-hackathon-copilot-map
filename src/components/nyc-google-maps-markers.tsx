'use client'

import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import ReactMarkdown from 'react-markdown'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is missing')
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

interface MapMarker {
  id: string
  lat: number
  lng: number
  name: string
  description: string
  created_at: string
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
    googleMapsApiKey: GOOGLE_MAPS_API_KEY!
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null)

  const form = useForm({
    defaultValues: {
      name: '',
      description: ''
    }
  })

  useEffect(() => {
    fetchMarkers()
  }, [])

  const fetchMarkers = async () => {
    try {
      console.log('Fetching markers...')
      const { data, error } = await supabase
        .from('markers')
        .select('*')
      if (error) {
        throw error
      }
      console.log('Fetched markers:', data)
      setMarkers(data || [])
    } catch (error) {
      console.error('Error fetching markers:', error)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = reader.result as string
        const imageMarkdown = `![${file.name}](${base64String})\n`
        form.setValue('description', form.getValues('description') + imageMarkdown)
      }
      reader.readAsDataURL(file)
    })
  }, [form])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': []
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

  const addMarker = async (lat: number, lng: number, name: string, description: string) => {
    try {
      console.log('Adding marker:', { lat, lng, name, description })
      const { data, error } = await supabase
        .from('markers')
        .insert([{ lat, lng, name, description }])
        .select()
      if (error) {
        throw error
      }
      console.log('Added marker:', data)
      if (data) {
        setMarkers(prevMarkers => [...prevMarkers, data[0]])
        console.log('Marker added successfully')
      }
    } catch (error) {
      console.error('Error adding marker:', error)
    }
  }

  const removeMarker = async (id: string) => {
    try {
      console.log('Removing marker:', id)
      const { error } = await supabase
        .from('markers')
        .delete()
        .eq('id', id)
      if (error) {
        throw error
      }
      console.log('Removed marker:', id)
      setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== id))
      console.log('Marker removed successfully')
    } catch (error) {
      console.error('Error removing marker:', error)
    }
  }

  const onSubmit = async (data: { name: string; description: string }) => {
    if (clickedLocation) {
      await addMarker(clickedLocation.lat, clickedLocation.lng, data.name, data.description)
      setIsDialogOpen(false)
      form.reset()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
                  <div className="w-full">
                    <h3 className="font-semibold">{marker.name}</h3>
                    <p className="text-sm text-gray-600">
                      Lat: {marker.lat.toFixed(4)}, Lng: {marker.lng.toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Created: {formatDate(marker.created_at)}
                    </p>
                    <div className="mt-2 prose prose-sm max-w-none">
                      <ReactMarkdown>{marker.description}</ReactMarkdown>
                    </div>
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
                    <FormLabel>Description (Markdown supported)</FormLabel>
                    <FormControl>
                      <div>
                        <Textarea 
                          placeholder="Enter location description (Markdown supported)" 
                          {...field} 
                          rows={5}
                        />
                        <div 
                          {...getRootProps()} 
                          className={`mt-2 border-2 border-dashed p-4 text-center cursor-pointer ${
                            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                          }`}
                        >
                          <input {...getInputProps()} />
                          {isDragActive ? (
                            <p>Drop the image here ...</p>
                          ) : (
                            <p>Drag 'n' drop an image here, or click to select one</p>
                          )}
                        </div>
                      </div>
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