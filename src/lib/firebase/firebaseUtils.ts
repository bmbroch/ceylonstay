import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
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
export const uploadFile = async (file: File, path: string) => {
  try {
    const storageRef = ref(storage, path);
    
    // Add metadata to the upload
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        size: file.size.toString(),
        uploadedAt: new Date().toISOString(),
      },
    };

    // Upload the file with metadata
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error: any) {
    console.error("Error uploading file:", error);
    // Add more specific error handling
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please check Firebase Storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Unknown error occurred during upload.');
    }
    throw error;
  }
};
