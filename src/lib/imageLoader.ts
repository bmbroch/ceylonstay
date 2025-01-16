import type { ImageLoaderProps } from 'next/image';

export const imageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  // Handle undefined or empty src
  if (!src) {
    console.warn('Image source is undefined or empty');
    return '';
  }

  // If it's a Firebase Storage URL
  if (src.startsWith('https://firebasestorage.googleapis.com')) {
    // The URL is already properly formatted with alt=media and token
    // Just decode it to ensure special characters are handled correctly
    try {
      return decodeURIComponent(src);
    } catch (error) {
      console.error('Error decoding URL:', error);
      return src;
    }
  }
  
  // For non-Firebase URLs, return as is
  return src;
}; 