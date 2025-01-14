import { ImageLoader } from 'next/image'

export const imageLoader: ImageLoader = ({ src, width, quality }) => {
  // If the image is from Firebase Storage
  if (src.includes('firebasestorage.googleapis.com')) {
    // Extract the base URL and token
    const [baseUrl, token] = src.split('?')
    // Add width and quality parameters while preserving the token
    return `${baseUrl}?w=${width}&q=${quality || 75}&${token}`
  }
  
  // For other image sources, return as is
  return src
} 