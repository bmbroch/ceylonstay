'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { Heart, ChevronLeft, ChevronRight, Info, Search, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getDocuments, FirebaseDoc, updateDocument } from '@/lib/firebase/firebaseUtils'
import Image from 'next/image'
import { imageLoader } from '@/lib/imageLoader'
import { PropertySkeletonGrid } from '@/components/ui/property-skeleton'

interface Property extends FirebaseDoc {}

function PropertyImages({ property, activeIndex, onNext, onPrev, onOpenGallery, index }: { 
  property: Property; 
  activeIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onOpenGallery: () => void;
  index: number;
}) {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
      {!imagesLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {property.photos.map((photo, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-300 ${
            activeIndex === idx ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            loader={imageLoader}
            src={photo.url}
            alt={`${property.title} ${idx + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={index < 3 && idx === 0}
            loading={index < 3 ? "eager" : "lazy"}
            quality={75}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYxMC8vMTQ3PEFGNzhLOj0tRGJFS1NWW1xbOEVnaWVsdlNfYV3/2wBDARUXFx4aHR4eHV3KHy0fyt3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            onLoad={() => {
              setImagesLoaded(true);
              console.log('Image URL:', photo.url);
              console.log('Processed URL:', imageLoader({ src: photo.url, width: 800, quality: 75 }));
            }}
          />
        </div>
      ))}
      
      <button
        onClick={(e) => {
          e.preventDefault();
          onOpenGallery();
        }}
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/30 hover:bg-black/70 transition-colors opacity-40 group-hover:opacity-100"
      >
        <Search className="h-4 w-4 text-white" />
      </button>

      {property.photos.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {property.photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-1.5 rounded-full ${
                  activeIndex === idx
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
              onPrev()
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
              onNext()
            }}
          >
            <ChevronRight className="h-5 w-5 stroke-white" />
          </Button>
        </>
      )}
    </div>
  );
}

function PropertyDetails({ property, onShowDescription }: { 
  property: Property; 
  onShowDescription: () => void;
}) {
  const getAvailabilityText = (availableDate: string) => {
    try {
      const dateObj = new Date(availableDate);
      const today = new Date();
      
      // Check if it's a valid date
      if (isNaN(dateObj.getTime())) {
        return { text: 'Available now', isNow: true };
      }
      
      // Compare dates without time
      const isToday = dateObj.toDateString() === today.toDateString();
      if (isToday) {
        return { text: 'Available now', isNow: true };
      }
      
      // For future dates, format as "Available Jan 14" or "Available Jan 14, 2025" if different year
      const currentYear = today.getFullYear();
      const dateYear = dateObj.getFullYear();
      
      if (currentYear === dateYear) {
        return { 
          text: `Available ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          isNow: false 
        };
      } else {
        return { 
          text: `Available ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          isNow: false 
        };
      }
    } catch (error) {
      return { text: 'Available now', isNow: true };
    }
  };

  const availability = getAvailabilityText(property.availableDate || 'now');

  return (
    <div className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-black">{property.title}</h3>
          <p className="text-sm text-gray-500">{property.location}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
          availability.isNow
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {availability.text}
        </span>
      </div>
      <div className="flex gap-2 mt-1">
        <p className="text-sm text-gray-500">{property.bedrooms} 🛌</p>
        <span className="text-sm text-gray-500">•</span>
        <p className="text-sm text-gray-500">{property.bathrooms} 🚽</p>
        {property.description && (
          <button
            onClick={onShowDescription}
            className="ml-auto text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2">
        <span className="font-semibold text-black">
          ${property.pricingType === 'night' 
            ? property.pricePerNight?.toLocaleString() 
            : property.pricePerMonth?.toLocaleString()}
        </span>{' '}
        <span className="text-gray-500">/ {property.pricingType}</span>
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
  );
}

function FullscreenGallery({ 
  property, 
  activeIndex, 
  onClose, 
  onNext, 
  onPrev 
}: { 
  property: Property; 
  activeIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 text-white">
        <h3 className="text-lg font-semibold">{property.title}</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            loader={imageLoader}
            src={property.photos[activeIndex].url}
            alt={`${property.title} ${activeIndex + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            quality={100}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
          onClick={onPrev}
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
          onClick={onNext}
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </Button>
      </div>

      <div className="p-4 text-white text-center">
        {activeIndex + 1} / {property.photos.length}
      </div>
    </div>
  );
}

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([])
  const [activeImageIndexes, setActiveImageIndexes] = useState<{ [key: string]: number }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeDescription, setActiveDescription] = useState<string | null>(null)
  const [activeGallery, setActiveGallery] = useState<string | null>(null)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const listings = await getDocuments('ceylonstays') as FirebaseDoc[]
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        // Process data in chunks to avoid blocking the main thread
        const processListings = () => {
          const processed = listings
            .filter(doc => doc.isListed ?? true)
            .map(doc => ({
              id: doc.id,
              title: doc.title || '',
              description: doc.description || '',
              location: doc.location || '',
              bathrooms: doc.bathrooms || 0,
              bedrooms: doc.bedrooms || 0,
              pricePerNight: doc.pricePerNight || 0,
              pricePerMonth: doc.pricePerMonth || 0,
              pricingType: doc.pricingType || 'night',
              photos: doc.photos || [],
              createdAt: doc.createdAt || '',
              isListed: doc.isListed ?? true,
              availableDate: doc.availableDate || 'now'
            }))
            .sort((a, b) => {
              // Parse dates, defaulting to now if invalid
              const dateA = new Date(a.availableDate)
              const dateB = new Date(b.availableDate)
              const validDateA = isNaN(dateA.getTime()) ? now : dateA
              const validDateB = isNaN(dateB.getTime()) ? now : dateB

              validDateA.setHours(0, 0, 0, 0)
              validDateB.setHours(0, 0, 0, 0)

              const isAvailableNowA = validDateA <= now
              const isAvailableNowB = validDateB <= now

              if (isAvailableNowA && !isAvailableNowB) return -1
              if (!isAvailableNowA && isAvailableNowB) return 1

              return validDateA.getTime() - validDateB.getTime()
            });

          setProperties(processed);
          setIsLoading(false);
        };

        // Use requestIdleCallback for non-critical processing
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(processListings);
        } else {
          setTimeout(processListings, 0);
        }
      } catch (error) {
        console.error('Error fetching properties:', error)
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  // Memoize image navigation functions to prevent unnecessary re-renders
  const nextImage = useCallback((propertyId: string) => {
    setActiveImageIndexes(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) + 1) % properties.find(p => p.id === propertyId)!.photos.length
    }))
  }, [properties])

  const prevImage = useCallback((propertyId: string) => {
    setActiveImageIndexes(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) - 1 + properties.find(p => p.id === propertyId)!.photos.length) % properties.find(p => p.id === propertyId)!.photos.length
    }))
  }, [properties])

  const handleToggleStatus = async (propertyId: string, currentStatus: boolean) => {
    try {
      await updateDocument('ceylonstays', propertyId, { isListed: !currentStatus });
      setProperties(prev => prev.map(p => 
        p.id === propertyId ? { ...p, isListed: !currentStatus } : p
      ));
    } catch (error) {
      console.error('Error toggling listing status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <PropertySkeletonGrid />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white px-1 py-2 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto">
        {properties.map((property) => (
          <Card key={property.id} className="group overflow-hidden">
            <Suspense fallback={
              <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                <div className="text-sm text-gray-500">Loading images...</div>
              </div>
            }>
              <PropertyImages 
                property={property}
                activeIndex={activeImageIndexes[property.id] || 0}
                onNext={() => nextImage(property.id)}
                onPrev={() => prevImage(property.id)}
                onOpenGallery={() => setActiveGallery(property.id)}
                index={0}
              />
            </Suspense>
            <PropertyDetails 
              property={property}
              onShowDescription={() => setActiveDescription(activeDescription === property.description ? null : property.description)}
            />
          </Card>
        ))}
      </div>
      
      {/* Description Popup */}
      {activeDescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setActiveDescription(null)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <p className="text-gray-700 whitespace-pre-wrap">{activeDescription}</p>
            <button
              onClick={() => setActiveDescription(null)}
              className="mt-4 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Gallery */}
      {activeGallery && (
        <FullscreenGallery
          property={properties.find(p => p.id === activeGallery)!}
          activeIndex={activeImageIndexes[activeGallery] || 0}
          onClose={() => setActiveGallery(null)}
          onNext={() => nextImage(activeGallery)}
          onPrev={() => prevImage(activeGallery)}
        />
      )}
    </main>
  )
}

