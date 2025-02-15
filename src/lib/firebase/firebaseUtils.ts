import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  DocumentData
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export interface PhotoData {
  id: string;
  url: string;
  sortOrder: number;
  fileName: string;
  uploadedAt: string;
}

export interface FirebaseDoc extends DocumentData {
  id: string;
  title: string;
  description: string;
  location: string;
  bathrooms: number;
  bedrooms: number;
  pricePerNight?: number;
  pricePerMonth?: number;
  pricingType: 'night' | 'month';
  photos: PhotoData[];
  createdAt: string;
  isListed: boolean;
  availableDate: string | 'now'; // 'now' or ISO date string
}

// Add collection name constants
const COLLECTION_NAMES = {
  development: 'ceylonstays',
  production: 'ceylonstaysproduction'
};

// Helper to get the correct collection name based on environment
export const getCollectionName = () => {
  return process.env.NODE_ENV === 'production' 
    ? COLLECTION_NAMES.production 
    : COLLECTION_NAMES.development;
};

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (data: any) =>
  addDoc(collection(db, getCollectionName()), data);

export const getDocument = async (id: string): Promise<FirebaseDoc | null> => {
  const docRef = doc(db, getCollectionName(), id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as FirebaseDoc;
  }
  return null;
};

let cachedDocuments: { [key: string]: { data: any[], timestamp: number } } = {}
const CACHE_DURATION = 30000 // 30 seconds cache

export const getDocuments = async () => {
  // Check cache first
  const collectionName = getCollectionName();
  const cached = cachedDocuments[collectionName]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  const querySnapshot = await getDocs(collection(db, collectionName))
  const documents = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))

  // Update cache
  cachedDocuments[collectionName] = {
    data: documents,
    timestamp: Date.now()
  }

  return documents
}

export const updateDocument = (id: string, data: any) =>
  updateDoc(doc(db, getCollectionName(), id), data);

export const deleteDocument = (id: string) =>
  deleteDoc(doc(db, getCollectionName(), id));

// Storage functions
export const uploadFile = async (file: File, path: string, retryCount = 0): Promise<PhotoData> => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      try {
        // Try anonymous sign in
        await signInAnonymously(auth);
        console.log('Signed in anonymously for upload');
      } catch (authError) {
        console.error('Failed to sign in anonymously:', authError);
        throw new Error('Authentication failed. Please try again.');
      }
    }

    if (!auth.currentUser) {
      throw new Error('Still not authenticated after sign-in attempt');
    }

    console.log('Using storage path:', path);
    const storageRef = ref(storage, path);
    
    // Add metadata
    const metadata = {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        originalName: file.name,
        size: file.size.toString(),
        uploadedAt: new Date().toISOString()
      }
    };

    console.log('Starting upload to path:', path);
    
    // Upload using Firebase SDK with retry logic
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('Upload completed, getting download URL');
    
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log('Got download URL:', downloadUrl);

    // Return photo data
    return {
      id: path.split('/').pop() || '',
      url: downloadUrl,
      fileName: path,
      sortOrder: 0,
      uploadedAt: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Error in uploadFile:', error);
    
    // Retry logic for transient errors
    if (retryCount < 3) {
      console.log(`Retrying upload (attempt ${retryCount + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return uploadFile(file, path, retryCount + 1);
    }
    
    throw new Error(`Upload failed after ${retryCount} retries: ${error?.message || 'Unknown error'}`);
  }
};

// Add new utility functions for photo management
export const updatePhotoOrder = async (
  docId: string,
  photos: PhotoData[]
): Promise<void> => {
  // Ensure each photo is a proper object before updating
  const validatedPhotos = photos.map((photo, index) => ({
    id: photo.id || `photo-${index}`,
    url: photo.url || '',
    fileName: photo.fileName || `photo-${index}.jpg`,
    uploadedAt: photo.uploadedAt || new Date().toISOString(),
    sortOrder: index
  }));

  // Update photos array with validated data
  await updateDocument(docId, {
    photos: validatedPhotos
  });
};

export const deletePhoto = async (
  docId: string,
  photoId: string
): Promise<void> => {
  try {
    // Get the current document
    const doc = await getDocument(docId);
    if (!doc) throw new Error('Document not found');

    // Find the photo to delete
    const photoToDelete = doc.photos.find(p => p.id === photoId);
    if (!photoToDelete) throw new Error('Photo not found');

    // Delete from Storage
    const storageRef = ref(storage, photoToDelete.fileName);
    try {
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting from storage:', error);
      // Continue even if storage delete fails
    }

    // Update Firestore document with filtered photos array
    const updatedPhotos = doc.photos
      .filter(p => p.id !== photoId)
      .map((photo, index) => ({
        ...photo,
        sortOrder: index
      }));

    await updateDocument(docId, { photos: updatedPhotos });
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};
