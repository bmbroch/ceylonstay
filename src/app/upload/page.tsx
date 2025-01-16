"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addDocument, uploadFile, getDocument, updateDocument, getDocuments, FirebaseDoc, PhotoData, updatePhotoOrder, deletePhoto, getCollectionName } from "@/lib/firebase/firebaseUtils";
import { auth } from "@/lib/firebase/firebase";
import { signInAnonymously } from "firebase/auth";
import { Pencil, Plus, CalendarIcon, GripVertical, X } from "lucide-react";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import dynamic from 'next/dynamic';
import { imageLoader } from '@/lib/imageLoader';

const PASSCODE = "13579";

interface Listing extends FirebaseDoc {}

interface DragItem {
  type: 'existing' | 'new';
  index: number;
}

type PricingType = 'night' | 'month';

interface FormDataType {
  title: string;
  description: string;
  location: string;
  bathrooms: number;
  bedrooms: number;
  pricePerNight: number;
  pricePerMonth: number;
  pricingType: PricingType;
  availableDate: string;
}

const INITIAL_FORM_DATA: FormDataType = {
  title: "",
  description: "",
  location: "",
  bathrooms: 1,
  bedrooms: 1,
  pricePerNight: 0,
  pricePerMonth: 0,
  pricingType: 'night',
  availableDate: ''
};

// Create a separate password component
function PasswordForm({ onSubmit, passcode, setPasscode }: { 
  onSubmit: (e: React.FormEvent) => void;
  passcode: string;
  setPasscode: (value: string) => void;
}) {
  return (
    <div className="min-h-screen bg-white flex items-start justify-center pt-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Enter Passcode</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter the passcode to manage listings
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div>
            <label htmlFor="passcode" className="sr-only">
              Passcode
            </label>
            <input
              id="passcode"
              name="passcode"
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter passcode"
            />
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create a client-only version of the password form
const ClientOnlyPasswordForm = dynamic(() => Promise.resolve(PasswordForm), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  )
});

export default function UploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [listings, setListings] = useState<FirebaseDoc[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataType>(INITIAL_FORM_DATA);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<PhotoData[]>([]);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Add refreshListings function inside the component
  const refreshListings = async () => {
    const fetchedListings = await getDocuments();
    setListings(fetchedListings);
  };

  // Initialize form data with current date after mount
  useEffect(() => {
    if (formData.availableDate === '') {
      setFormData(prev => ({
        ...prev,
        availableDate: new Date().toISOString()
      }));
    }
  }, [formData.availableDate]);

  // Add authentication effect - only run after password is verified
  useEffect(() => {
    const authenticate = async () => {
      if (!isPasswordVerified) return;
      
      try {
        await signInAnonymously(auth);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication error:', error);
        setError('Failed to authenticate. Please try again.');
      }
    };

    if (!isAuthenticated && isPasswordVerified) {
      authenticate();
    }
  }, [isAuthenticated, isPasswordVerified]);

  // Load listings after authentication
  useEffect(() => {
    const loadListings = async () => {
      if (isAuthenticated) {
        try {
          const fetchedListings = await getDocuments();
          const sortedListings = fetchedListings
            .map(doc => ({
              id: doc.id,
              title: doc.title || '',
              description: doc.description || '',
              location: doc.location || '',
              pricePerNight: doc.pricePerNight || 0,
              pricePerMonth: doc.pricePerMonth || 0,
              pricingType: doc.pricingType || 'night',
              bedrooms: doc.bedrooms || 0,
              bathrooms: doc.bathrooms || 0,
              createdAt: doc.createdAt || '',
              isListed: doc.isListed ?? true,
              availableDate: doc.availableDate || new Date().toISOString(),
              photos: doc.photos || []
            } as Listing))
            .sort((a, b) => {
              const dateA = new Date(a.availableDate);
              const dateB = new Date(b.availableDate);
              const now = new Date();
              
              // Set time to midnight for accurate date comparison
              now.setHours(0, 0, 0, 0);
              dateA.setHours(0, 0, 0, 0);
              dateB.setHours(0, 0, 0, 0);
              
              // Handle invalid dates by treating them as "now"
              const validDateA = isNaN(dateA.getTime()) ? now : dateA;
              const validDateB = isNaN(dateB.getTime()) ? now : dateB;
              
              // Check if dates are today or in the past (available now)
              const isAvailableNowA = validDateA <= now;
              const isAvailableNowB = validDateB <= now;
              
              // If one is available now and the other isn't, prioritize available now
              if (isAvailableNowA && !isAvailableNowB) return -1;
              if (!isAvailableNowA && isAvailableNowB) return 1;
              
              // If both are available now or both are future dates, sort by date
              return validDateA.getTime() - validDateB.getTime();
            });
          setListings(sortedListings);
        } catch (error) {
          console.error('Error loading listings:', error);
        }
      }
    };

    loadListings();
  }, [isAuthenticated]);

  // Load listing data after authentication
  useEffect(() => {
    const loadListing = async () => {
      if (editId && editId !== 'new') {
        const listing = await getDocument(editId);
        if (listing) {
          setFormData({
            title: listing.title || '',
            description: listing.description || '',
            location: listing.location || '',
            bathrooms: listing.bathrooms || 1,
            bedrooms: listing.bedrooms || 1,
            pricePerNight: listing.pricePerNight || 0,
            pricePerMonth: listing.pricePerMonth || 0,
            pricingType: listing.pricingType || 'night',
            availableDate: listing.availableDate || new Date().toISOString()
          });
          setExistingPhotos(listing.photos || []);
        }
      }
    };

    loadListing();
  }, [editId]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === PASSCODE) {
      setIsPasswordVerified(true);
    } else {
      alert("Incorrect passcode. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      ...INITIAL_FORM_DATA,
      availableDate: new Date().toISOString()
    });
    setSelectedFiles([]);
    setExistingPhotos([]);
    setUploadError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUploadError('');

    try {
      const uploadPromises = selectedFiles.map(file => {
        const collectionName = process.env.NODE_ENV === 'production' ? 'ceylonstaysproduction' : 'ceylonstays';
        const path = `${collectionName}/${Date.now()}-${file.name}`;
        return uploadFile(file, path);
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      const allPhotos = [...existingPhotos, ...uploadedPhotos].map((photo, index) => ({
        ...photo,
        sortOrder: index
      }));

      const data: Partial<FirebaseDoc> = {
        ...formData,
        photos: allPhotos,
        updatedAt: new Date().toISOString()
      };

      if (editId === 'new') {
        await addDocument({
          ...data,
          createdAt: new Date().toISOString(),
          isListed: true
        });
      } else if (editId) {
        await updateDocument(editId, data);
      }

      resetForm();
      setEditId(null);
      refreshListings();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        const validFiles = files.filter(file => file.type.startsWith('image/'));
        setSelectedFiles(prev => [...prev, ...validFiles]);
      } catch (error) {
        console.error('Error handling files:', error);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleListingToggle = async (listingId: string, currentStatus: boolean) => {
    try {
      await updateDocument(listingId, {
        isListed: !currentStatus,
        updatedAt: new Date().toISOString()
      });
      refreshListings();
    } catch (error) {
      console.error('Error toggling listing status:', error);
    }
  };

  useEffect(() => {
    if (editId === 'new') {
      resetForm();
    }
  }, [editId]);

  // Add a helper function to format the date display
  const formatAvailableDate = (date: string) => {
    try {
      const dateObj = new Date(date);
      const today = new Date();
      
      // Check if it's a valid date
      if (isNaN(dateObj.getTime())) {
        return 'Now';
      }
      
      // Compare dates without time
      const isToday = dateObj.toDateString() === today.toDateString();
      if (isToday) {
        return 'Now';
      }
      
      // For future dates, format as "Jan 14" or "Jan 14, 2025" if different year
      const currentYear = today.getFullYear();
      const dateYear = dateObj.getFullYear();
      
      if (currentYear === dateYear) {
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (error) {
      return 'Now';
    }
  };

  const handleDragStart = (type: 'existing' | 'new', index: number) => {
    setDraggedItem({ type, index });
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent, type: 'existing' | 'new', index: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.type === 'existing' && type === 'existing') {
      if (draggedItem.index === index) return;
      
      const newPhotos = [...existingPhotos];
      const [movedItem] = newPhotos.splice(draggedItem.index, 1);
      newPhotos.splice(index, 0, movedItem);
      setExistingPhotos(newPhotos);
      setDraggedItem({ type: 'existing', index });
    } else if (draggedItem.type === 'new' && type === 'new') {
      if (draggedItem.index === index) return;
      
      const newFiles = [...selectedFiles];
      const [movedItem] = newFiles.splice(draggedItem.index, 1);
      newFiles.splice(index, 0, movedItem);
      setSelectedFiles(newFiles);
      setDraggedItem({ type: 'new', index });
    }
  };

  // Add reorder function
  const handleReorderPhotos = (result: any) => {
    if (!result.destination) return;

    const reorderedPhotos = Array.from(existingPhotos);
    const [removed] = reorderedPhotos.splice(result.source.index, 1);
    reorderedPhotos.splice(result.destination.index, 0, removed);

    // Ensure photos are properly structured objects
    const updatedPhotos = reorderedPhotos.map((photo, index) => {
      // Handle string URLs (convert to proper PhotoData object)
      if (typeof photo === 'string') {
        return {
          id: `photo-${index}`,
          url: photo,
          fileName: `photo-${index}.jpg`,
          uploadedAt: new Date().toISOString(),
          sortOrder: index
        };
      }
      
      // Handle existing PhotoData objects
      if (photo && typeof photo === 'object') {
        return {
          id: photo.id || `photo-${index}`,
          url: photo.url || '',
          fileName: photo.fileName || `photo-${index}.jpg`,
          uploadedAt: photo.uploadedAt || new Date().toISOString(),
          sortOrder: index
        };
      }

      // Fallback case (shouldn't happen)
      return {
        id: `photo-${index}`,
        url: '',
        fileName: `photo-${index}.jpg`,
        uploadedAt: new Date().toISOString(),
        sortOrder: index
      };
    });

    // Update local state with properly structured objects
    setExistingPhotos(updatedPhotos);

    // Update in Firebase with the properly structured array
    if (editId && editId !== 'new') {
      updatePhotoOrder(editId, updatedPhotos);
    }
  };

  // Add delete function
  const handleDeletePhoto = async (photoId: string) => {
    if (!editId || editId === 'new') return;

    try {
      await deletePhoto(editId, photoId);
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  // Add this helper function to handle photo URLs
  const getPhotoUrl = (photo: string | PhotoData) => {
    if (typeof photo === 'string') return photo;
    return photo.url;
  };

  // Show password screen first
  if (!isPasswordVerified) {
    return (
      <ClientOnlyPasswordForm
        onSubmit={handlePasscodeSubmit}
        passcode={passcode}
        setPasscode={setPasscode}
      />
    );
  }

  // Show loading state while authenticating with Firebase
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (editId === 'new' || editId) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-6 sm:py-12 px-0 sm:px-6 lg:px-8">
        <div className="w-full sm:max-w-2xl mx-auto bg-white sm:rounded-xl shadow-2xl p-4 sm:p-8 ring-1 ring-gray-100">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{editId === 'new' ? 'Add New' : 'Edit'} Listing</h1>
            <button
              onClick={() => {
                resetForm();
                setEditId(null);
              }}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
                  Bathrooms
                </label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  required
                  min="1"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
                  Bedrooms
                </label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  required
                  min="1"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Pricing Type
                </label>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pricingType: 'night' }))}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      formData.pricingType === 'night'
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Per Night
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pricingType: 'month' }))}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      formData.pricingType === 'month'
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Per Month
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price {formData.pricingType === 'night' ? 'Per Night' : 'Per Month'}
                </label>
                <input
                  type="number"
                  id="price"
                  name={formData.pricingType === 'night' ? 'pricePerNight' : 'pricePerMonth'}
                  value={formData.pricingType === 'night' ? formData.pricePerNight : formData.pricePerMonth}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100
                  focus:outline-none"
              />
              <div className="mt-4">
                <DragDropContext onDragEnd={handleReorderPhotos}>
                  <Droppable droppableId="photos" direction="horizontal">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                      >
                        {existingPhotos.map((photo, index) => (
                          <Draggable 
                            key={photo.id || `existing-${index}`}
                            draggableId={photo.id || `existing-${index}`}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="relative group aspect-[4/3]"
                              >
                                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded-lg">
                                  <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    {index === 0 ? 'Cover' : `Photo ${index + 1}`}
                                  </div>
                                  <div className="absolute top-2 right-2 z-10 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                  {(() => {
                                    const photoUrl = typeof photo === 'string' ? photo : photo?.url;
                                    return photoUrl ? (
                                      <Image
                                        src={photoUrl}
                                        alt={`Property photo ${index + 1}`}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                        onError={(e) => {
                                          console.error('Image load error for photo:', index, 'URL:', photoUrl);
                                        }}
                                      />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <span className="text-gray-400">No photo</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <button
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  className="absolute bottom-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {selectedFiles.map((file, index) => (
                          <Draggable 
                            key={`new-${index}`}
                            draggableId={`new-${index}`}
                            index={existingPhotos.length + index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="relative group aspect-[4/3]"
                              >
                                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded-lg">
                                  <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    {existingPhotos.length + index === 0 ? 'Cover' : `Photo ${existingPhotos.length + index + 1}`}
                                  </div>
                                  <div className="absolute top-2 right-2 z-10 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                  <Image
                                    src={URL.createObjectURL(file)}
                                    alt={`New photo ${index + 1}`}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                </div>
                                <button
                                  onClick={() => removeFile(index)}
                                  className="absolute bottom-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Availability
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    availableDate: new Date().toISOString() 
                  }))}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    new Date(formData.availableDate).toDateString() === new Date().toDateString()
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Available Now
                </button>

                <div className="relative w-full sm:w-auto">
                  <DatePicker
                    selected={(() => {
                      try {
                        return new Date(formData.availableDate);
                      } catch (error) {
                        return new Date();
                      }
                    })()}
                    onChange={(date) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        availableDate: (date || new Date()).toISOString() 
                      }))
                    }}
                    dateFormat="MMMM d, yyyy"
                    minDate={new Date()}
                    className="w-full sm:w-[240px] px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    calendarClassName="!bg-white !rounded-lg !border !border-gray-200 !shadow-lg !font-sans"
                    popperClassName="!z-[100]"
                    withPortal
                    portalId="root"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {uploadError && (
              <div className="text-red-500 text-sm">{uploadError}</div>
            )}

            <button
              type="submit"
              disabled={isLoading || 
                !formData.title || 
                !formData.location || 
                (formData.pricingType === 'night' ? formData.pricePerNight <= 0 : formData.pricePerMonth <= 0) ||
                (selectedFiles.length === 0 && existingPhotos.length === 0) ||
                !formData.availableDate
              }
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium
                ${isLoading || !formData.title || !formData.location || (formData.pricingType === 'night' ? formData.pricePerNight <= 0 : formData.pricePerMonth <= 0) || (selectedFiles.length === 0 && existingPhotos.length === 0) || !formData.availableDate
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? (editId ? 'Updating...' : 'Uploading...') : (editId ? 'Update Listing' : 'Upload Listing')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      {!isPasswordVerified ? (
        <ClientOnlyPasswordForm
          onSubmit={handlePasscodeSubmit}
          passcode={passcode}
          setPasscode={setPasscode}
        />
      ) : !isAuthenticated ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Manage Listings</h1>
            <button
              onClick={() => setEditId('new')}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Listing
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thumbnail
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.map((listing) => {
                    const thumbnailUrl = listing.photos?.[0]?.url || (typeof listing.photos?.[0] === 'string' ? listing.photos[0] : '');
                    return (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-16 w-16 relative">
                            {thumbnailUrl ? (
                              <Image
                                src={thumbnailUrl}
                                alt={listing.title}
                                fill
                                unoptimized
                                className="object-cover rounded"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No image</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{listing.location}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            ${listing.pricingType === 'night' 
                              ? listing.pricePerNight?.toLocaleString() 
                              : listing.pricePerMonth?.toLocaleString()}
                            <span className="text-gray-500">/{listing.pricingType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleListingToggle(listing.id, listing.isListed)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              listing.isListed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {listing.isListed ? 'Listed' : 'Unlisted'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setEditId(listing.id)}
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 