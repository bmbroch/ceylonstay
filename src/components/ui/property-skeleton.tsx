import React from 'react';
import { Card } from "./card";

export function PropertySkeleton() {
  return (
    <Card className="w-full overflow-hidden">
      <div className="relative w-full">
        {/* Image skeleton */}
        <div className="aspect-[4/3] w-full bg-gray-200 animate-pulse" />
        
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          {/* Title and price row */}
          <div className="flex justify-between items-start">
            <div className="w-2/3 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-1/4 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
          
          {/* Location */}
          <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
          
          {/* Amenities */}
          <div className="flex gap-2">
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* WhatsApp button */}
          <div className="w-full h-10 bg-gray-200 rounded animate-pulse mt-3" />
        </div>
      </div>
    </Card>
  );
}

export function PropertySkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto">
      {[...Array(6)].map((_, index) => (
        <PropertySkeleton key={index} />
      ))}
    </div>
  );
} 