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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  photos: string[];
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
export const uploadFile = async (file: File, path: string, retryCount = 0): Promise<string> => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      // Try anonymous sign in
      await signInAnonymously(auth);
      console.log('Signed in anonymously');
    }

    console.log('Starting file upload:', {
      name: file.name,
      type: file.type,
      size: file.size,
      path: path
    });

    // Create storage reference
    const storageRef = ref(storage, path);
    console.log('Storage reference created:', {
      ref: storageRef.toString(),
      fullPath: storageRef.fullPath,
      bucket: storageRef.bucket,
      name: storageRef.name
    });
    
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
    try {
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('Upload successful:', {
        ref: snapshot.ref.toString(),
        fullPath: snapshot.ref.fullPath,
        bucket: snapshot.ref.bucket,
        name: snapshot.ref.name,
        metadata: snapshot.metadata
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL generated:', downloadURL);
      
      return downloadURL;
    } catch (uploadError: any) {
      // Retry logic for network errors
      if (retryCount < 3 && 
          (uploadError.code === 'storage/network-error' || 
           uploadError.code === 'storage/retry-limit-exceeded')) {
        console.log(`Retrying upload (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return uploadFile(file, path, retryCount + 1);
      }
      throw uploadError;
    }
  } catch (error: any) {
    console.error("Error uploading file:", {
      code: error.code,
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please check if you are logged in and have proper permissions.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Unknown error occurred during upload. Please try again.');
    } else if (error.code === 'storage/no-default-bucket') {
      throw new Error(`Storage bucket not configured. Current bucket: ${storage.app?.options?.storageBucket}`);
    }
    throw new Error(`Upload failed: ${error.message}`);
  }
};
