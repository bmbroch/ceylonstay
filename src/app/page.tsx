'use client'

import { useState, useEffect } from 'react'
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getDocuments } from '@/lib/firebase/firebaseUtils'

interface FirebaseDoc {
  id: string;
  title: string;
  description: string;
  location: string;
  bathrooms: number;
  bedrooms: number;
  maxGuests: number;
  pricePerNight: number;
  photos: string[];
  createdAt: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  bathrooms: number;
  bedrooms: number;
  maxGuests: number;
  pricePerNight: number;
  photos: string[];
  createdAt: string;
}

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([])
  const [activeImageIndexes, setActiveImageIndexes] = useState<{ [key: string]: number }>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const listings = await getDocuments('ceylonstays') as FirebaseDoc[]
        setProperties(listings.map(doc => ({
          id: doc.id,
          title: doc.title || '',
          description: doc.description || '',
          location: doc.location || '',
          bathrooms: doc.bathrooms || 0,
          bedrooms: doc.bedrooms || 0,
          maxGuests: doc.maxGuests || 0,
          pricePerNight: doc.pricePerNight || 0,
          photos: doc.photos || [],
          createdAt: doc.createdAt || ''
        })))
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  const nextImage = (propertyId: string) => {
    setActiveImageIndexes(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) + 1) % properties.find(p => p.id === propertyId)!.photos.length
    }))
  }

  const prevImage = (propertyId: string) => {
    setActiveImageIndexes(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) - 1 + properties.find(p => p.id === propertyId)!.photos.length) % properties.find(p => p.id === propertyId)!.photos.length
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fefefe] p-6 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading listings...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#fefefe] p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.map((property) => (
          <Card key={property.id} className="group relative overflow-hidden rounded-xl border-0 shadow-sm">
            <div className="relative aspect-square overflow-hidden">
              {property.photos.map((photo, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    (activeImageIndexes[property.id] || 0) === idx ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`${property.title} ${idx + 1}`}
                    className="object-cover w-full h-full"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}
              
              {property.photos.length > 1 && (
                <>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {property.photos.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 w-1.5 rounded-full ${
                          (activeImageIndexes[property.id] || 0) === idx
                            ? 'bg-white'
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-3 top-[45%] -translate-y-1/2 z-10 backdrop-blur-sm bg-white/30 hover:bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault()
                      prevImage(property.id)
                    }}
                  >
                    <ChevronLeft className="h-5 w-5 stroke-white" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-[45%] -translate-y-1/2 z-10 backdrop-blur-sm bg-white/30 hover:bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault()
                      nextImage(property.id)
                    }}
                  >
                    <ChevronRight className="h-5 w-5 stroke-white" />
                  </Button>
                </>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-black">{property.title}</h3>
                  <p className="text-sm text-gray-500">{property.location}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <p className="text-sm text-gray-500">{property.bedrooms} bed</p>
                <span className="text-sm text-gray-500">•</span>
                <p className="text-sm text-gray-500">{property.bathrooms} bath</p>
                <span className="text-sm text-gray-500">•</span>
                <p className="text-sm text-gray-500">Max {property.maxGuests} guests</p>
              </div>
              <p className="mt-2">
                <span className="font-semibold text-black">${property.pricePerNight.toLocaleString()}</span>{' '}
                <span className="text-gray-500">/ night</span>
              </p>
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}

