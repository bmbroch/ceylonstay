import type { ImageLoaderProps } from 'next/image';

export const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  // If it's a Firebase Storage URL
  if (src.startsWith('https://firebasestorage.googleapis.com')) {
    // Parse the existing URL
    const url = new URL(src);
    
    // Add or update width and quality parameters
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', (quality || 75).toString());
    
    // Add a token parameter if it doesn't exist (Firebase requires this for caching)
    if (!url.searchParams.has('token')) {
      url.searchParams.set('alt', 'media');
    }
    
    return url.toString();
  }
  
  // For local images (from public directory), return as is
  return src;
}; 