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
              <a
                href={`https://wa.me/94779598514?text=${encodeURIComponent(`Hey! I'm interested in ${property.title}. Can you please give me more details?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-2 px-4 rounded-lg hover:bg-[#128C7E] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Message Host
              </a>
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}

