import type { ImageLoaderProps } from 'next/image';

export const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  // If it's a Firebase Storage URL, return it directly
  if (src.startsWith('https://firebasestorage.googleapis.com')) {
    // Add caching parameters to the URL
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${width}&q=${quality || 75}`;
  }
  
  // For local images (from public directory), use default behavior
  return src;
}; 