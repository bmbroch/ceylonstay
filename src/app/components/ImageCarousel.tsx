import React from 'react';
import Image from 'next/image';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
}

export default function ImageCarousel({ images, alt = "Property image" }: ImageCarouselProps) {
  return (
    <div className="relative w-full overflow-hidden">
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory touch-pan-x scrollbar-hide"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {images.map((image, index) => (
          <div 
            key={index} 
            className="flex-none w-full snap-center"
          >
            <div className="relative w-full h-64 md:h-80">
              <Image
                src={image}
                alt={`${alt} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={index === 0}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Optional: Add dots indicator */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-white/70"
          />
        ))}
      </div>
    </div>
  );
}

// Add these styles to your global CSS file
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`; 