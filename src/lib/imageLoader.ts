import type { ImageLoaderProps } from 'next/image';

export const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  // If it's a Firebase Storage URL
  if (src.startsWith('https://firebasestorage.googleapis.com')) {
    // Add width and quality parameters
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${width}&q=${quality || 75}`;
  }
  
  // For local images (from public directory), return as is
  return src;
}; 