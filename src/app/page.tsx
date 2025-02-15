'use client'

import React, { useState, useEffect, Suspense, useCallback } from 'react'
import { Heart, ChevronLeft, ChevronRight, Info, Search, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getDocuments, FirebaseDoc, updateDocument } from '@/lib/firebase/firebaseUtils'
import Image from 'next/image'
import { imageLoader } from '@/lib/imageLoader'
import { PropertySkeletonGrid } from '@/components/ui/property-skeleton'
import { useRouter } from 'next/navigation'
import InfoTile from '@/app/components/InfoTile'

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
  
  // Handle both string URLs and photo objects
  const validPhotos = property.photos?.map(photo => 
    typeof photo === 'string' ? photo : photo?.url
  ).filter(Boolean) || [];
  
  console.log('PropertyImages - property:', property.id, 'photos:', property.photos, 'validPhotos:', validPhotos);

  if (validPhotos.length === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-sm text-gray-500">No photos available</div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
      {!imagesLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {validPhotos.map((photoUrl, idx) => {
        console.log('Rendering photo:', photoUrl, 'for property:', property.id, 'at index:', idx);
        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-300 ${
              activeIndex === idx ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={photoUrl}
              alt={`${property.title} ${idx + 1}`}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index < 3 && idx === 0}
              loading={index < 3 ? "eager" : "lazy"}
              onLoad={() => {
                console.log('Image loaded:', photoUrl);
                setImagesLoaded(true);
              }}
              onError={(e) => {
                console.error('Image load error:', photoUrl, e);
              }}
            />
          </div>
        );
      })}
      
      <button
        onClick={(e) => {
          e.preventDefault();
          onOpenGallery();
        }}
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/30 hover:bg-black/70 transition-colors opacity-40 group-hover:opacity-100"
      >
        <Search className="h-4 w-4 text-white" />
      </button>

      {validPhotos.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {validPhotos.map((_, idx) => (
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
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dateObjStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      
      // If date is today or in the past, show "Available now"
      if (dateObjStart <= todayStart) {
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
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-black truncate" title={property.title}>{property.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{property.location}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 shrink-0 ${
          availability.isNow
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {availability.text}
        </span>
      </div>
      <div className="flex gap-2 mt-2">
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
      <div className="mt-3">
        <span className="font-semibold text-black">
          ${property.pricingType === 'night' 
            ? property.pricePerNight?.toLocaleString() 
            : property.pricePerMonth?.toLocaleString()}
        </span>{' '}
        <span className="text-gray-500">/ {property.pricingType}</span>
      </div>

      {/* Message Host Button */}
      <a
        href={`https://wa.me/94779598514?text=Hi! I'm interested in your ${property.title} listing on CeylonStay.`}
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
  // Handle both string URLs and photo objects
  const validPhotos = property.photos?.map(photo => 
    typeof photo === 'string' ? photo : photo?.url
  ).filter(Boolean) || [];
  
  if (validPhotos.length === 0) {
    return null;
  }

  const currentPhotoUrl = validPhotos[activeIndex];
  if (!currentPhotoUrl) {
    return null;
  }

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
            src={currentPhotoUrl}
            alt={`${property.title} ${activeIndex + 1}`}
            fill
            unoptimized
            className="object-contain"
            sizes="100vw"
            quality={100}
          />
        </div>

        {validPhotos.length > 1 && (
          <>
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
          </>
        )}
      </div>

      <div className="p-4 text-white text-center">
        {activeIndex + 1} / {validPhotos.length}
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
  const [visibleCount, setVisibleCount] = useState(8)
  const router = useRouter()

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        const listings = await getDocuments() as FirebaseDoc[];
        console.log('Raw listings from Firebase:', listings);
        
        if (!listings || listings.length === 0) {
          console.log('No listings found');
          setProperties([]);
          setIsLoading(false);
          return;
        }

        const now = new Date()
        now.setHours(0, 0, 0, 0)

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

        console.log('Processed listings:', processed);
        setProperties(processed);
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  // Memoize image navigation functions to prevent unnecessary re-renders
  const nextImage = useCallback((propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const validPhotos = property.photos?.map(photo => 
      typeof photo === 'string' ? photo : photo?.url
    ).filter(Boolean) || [];
    if (validPhotos.length === 0) return;

    setActiveImageIndexes(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) + 1) % validPhotos.length
    }));
  }, [properties]);

  const prevImage = useCallback((propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const validPhotos = property.photos?.map(photo => 
      typeof photo === 'string' ? photo : photo?.url
    ).filter(Boolean) || [];
    if (validPhotos.length === 0) return;

    setActiveImageIndexes(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) - 1 + validPhotos.length) % validPhotos.length
    }));
  }, [properties]);

  const handleListingToggle = async (propertyId: string, currentStatus: boolean) => {
    try {
      await updateDocument(propertyId, { isListed: !currentStatus });
      router.refresh();
    } catch (error) {
      console.error('Error toggling listing status:', error);
    }
  };

  const visibleProperties = properties.slice(0, visibleCount)
  const hasMore = properties.length > visibleCount

  const loadMore = () => {
    setVisibleCount(prev => prev + 8)
  }

  return (
    <div className="px-1 sm:px-6 lg:px-8 space-y-3">
      <InfoTile />
      
      {/* Property Owner CTA */}
      <div className="flex items-center justify-center gap-1.5">
        <p className="text-gray-600 text-sm">Property owner? Message us to get listed</p>
        <a
          href="https://wa.me/94779598514?text=Hi! I'm interested in listing my property on CeylonStay."
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#25D366] hover:text-[#128C7E] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PropertySkeletonGrid count={6} />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">No listings available</h2>
          <p className="mt-2 text-gray-600">Check back later for new properties.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProperties.map((property, index) => (
              <Card key={property.id} className="group overflow-hidden">
                <PropertyImages
                  property={property}
                  activeIndex={activeImageIndexes[property.id] || 0}
                  onNext={() => nextImage(property.id)}
                  onPrev={() => prevImage(property.id)}
                  onOpenGallery={() => setActiveGallery(property.id)}
                  index={index}
                />
                <PropertyDetails
                  property={property}
                  onShowDescription={() => setActiveDescription(property.description || null)}
                />
              </Card>
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Show more listings
              </button>
            </div>
          )}
        </div>
      )}

      {/* Description Modal */}
      {activeDescription && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActiveDescription(null)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Description</h3>
              <button onClick={() => setActiveDescription(null)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 whitespace-pre-wrap">{activeDescription}</p>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {activeGallery && (
        <FullscreenGallery
          property={properties.find(p => p.id === activeGallery)!}
          activeIndex={activeImageIndexes[activeGallery] || 0}
          onClose={() => setActiveGallery(null)}
          onNext={() => nextImage(activeGallery)}
          onPrev={() => prevImage(activeGallery)}
        />
      )}
    </div>
  )
}

