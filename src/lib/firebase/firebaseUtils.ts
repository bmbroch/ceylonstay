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
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocument = async (collectionName: string, id: string): Promise<FirebaseDoc | null> => {
  const docRef = doc(db, collectionName, id);
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

export const getDocuments = async (collectionName: string) => {
  // Check cache first
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

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string, retryCount = 0): Promise<PhotoData> => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      // Try anonymous sign in
      await signInAnonymously(auth);
      console.log('Signed in anonymously');
    }

    // Create storage reference
    const storageRef = ref(storage, path);
    
    // Add metadata with CORS headers
    const metadata = {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        originalName: file.name,
        size: file.size.toString(),
        uploadedAt: new Date().toISOString()
      },
      cacheControl: 'public,max-age=31536000'
    };

    // Upload using Firebase SDK with retry logic
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    // Return photo data with alt=media parameter
    return {
      id: path.split('/').pop() || '',
      url: `${downloadUrl}?alt=media`,
      fileName: file.name,
      sortOrder: 0,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Retry logic for transient errors
    if (retryCount < 3) {
      console.log(`Retrying upload (attempt ${retryCount + 1})...`);
      return uploadFile(file, path, retryCount + 1);
    }
    
    throw error;
  }
};

// Add new utility functions for photo management
export const updatePhotoOrder = async (
  collectionName: string,
  docId: string,
  photos: PhotoData[]
): Promise<void> => {
  // Update photos array with new order
  await updateDocument(collectionName, docId, {
    photos: photos.map((photo, index) => ({
      ...photo,
      sortOrder: index
    }))
  });
};

export const deletePhoto = async (
  collectionName: string,
  docId: string,
  photoId: string
): Promise<void> => {
  try {
    // Get the current document
    const doc = await getDocument(collectionName, docId);
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

    await updateDocument(collectionName, docId, { photos: updatedPhotos });
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};
