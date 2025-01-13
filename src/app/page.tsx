'use client'

import { useState } from 'react'
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from 'next/image'

interface Property {
  id: number
  images: string[]
  location: string
  country: string
  dates: string
  monthlyPrice: number
}

const properties: Property[] = [
  {
    id: 1,
    images: [
      "https://images.unsplash.com/photo-1470290378698-263fa7ca60ab?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1470290378698-263fa7ca60ab?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1470290378698-263fa7ca60ab?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1470290378698-263fa7ca60ab?w=800&h=800&fit=crop"
    ],
    location: "Tropical Treehouse",
    country: "Bali, Indonesia",
    dates: "Available now",
    monthlyPrice: 2000,
  },
  {
    id: 2,
    images: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=800&fit=crop"
    ],
    location: "Beachfront Villa",
    country: "Phuket, Thailand",
    dates: "Available Jan 15",
    monthlyPrice: 2500,
  },
  {
    id: 3,
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=800&fit=crop"
    ],
    location: "Jungle Retreat",
    country: "Costa Rica",
    dates: "Available Feb 1",
    monthlyPrice: 1800,
  },
  {
    id: 4,
    images: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=800&fit=crop"
    ],
    location: "Island Paradise",
    country: "Maldives",
    dates: "Available now",
    monthlyPrice: 3000,
  },
]

export default function Home() {
  const [activeImageIndexes, setActiveImageIndexes] = useState<{ [key: number]: number }>({})
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  const nextImage = (propertyId: number) => {
    setActiveImageIndexes(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) + 1) % properties.find(p => p.id === propertyId)!.images.length
    }))
  }

  const prevImage = (propertyId: number) => {
    setActiveImageIndexes(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) - 1 + properties.find(p => p.id === propertyId)!.images.length) % properties.find(p => p.id === propertyId)!.images.length
    }))
  }

  const toggleFavorite = (propertyId: number) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(propertyId)) {
        next.delete(propertyId)
      } else {
        next.add(propertyId)
      }
      return next
    })
  }

  return (
    <main className="min-h-screen bg-[#fefefe] p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.map((property) => (
          <Card key={property.id} className="group relative overflow-hidden rounded-xl border-0 shadow-sm">
            <div className="relative aspect-square overflow-hidden">
              {property.images.map((image, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    (activeImageIndexes[property.id] || 0) === idx ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${property.location} ${idx + 1}`}
                    width={800}
                    height={800}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={idx === 0}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 z-10 backdrop-blur-sm bg-white/30 hover:bg-white/50"
                onClick={(e) => {
                  e.preventDefault()
                  toggleFavorite(property.id)
                }}
              >
                <Heart
                  className={`h-5 w-5 ${
                    favorites.has(property.id) ? 'fill-red-500 stroke-red-500' : 'stroke-white'
                  }`}
                />
              </Button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {property.images.map((_, idx) => (
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
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-black">{property.location}</h3>
                  <p className="text-sm text-gray-500">{property.country}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{property.dates}</p>
              <p className="mt-2">
                <span className="font-semibold text-black">${property.monthlyPrice.toLocaleString()}</span>{' '}
                <span className="text-gray-500">/ month</span>
              </p>
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}
