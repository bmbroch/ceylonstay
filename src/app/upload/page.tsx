"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addDocument, uploadFile, getDocument, updateDocument, getDocuments, FirebaseDoc } from "@/lib/firebase/firebaseUtils";
import { auth } from "@/lib/firebase/firebase";
import { signInAnonymously } from "firebase/auth";
import { Pencil, Plus, CalendarIcon } from "lucide-react";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PASSCODE = "13579";

interface Listing extends FirebaseDoc {}

export default function UploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    bathrooms: 1,
    bedrooms: 1,
    pricePerNight: 0,
    pricePerMonth: 0,
    pricingType: 'night' as 'night' | 'month',
    availableDate: new Date().toISOString()
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  // Load listings after authentication
  useEffect(() => {
    const loadListings = async () => {
      if (isAuthenticated) {
        try {
          const fetchedListings = await getDocuments('ceylonstays');
          setListings(fetchedListings.map(doc => ({
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
            availableDate: doc.availableDate || new Date().toISOString()
          } as Listing)));
        } catch (error) {
          console.error('Error loading listings:', error);
        }
      }
    };

    loadListings();
  }, [isAuthenticated]);

  // Load existing listing data if in edit mode
  useEffect(() => {
    const loadListing = async () => {
      if (editId && editId !== 'new' && isAuthenticated) {
        try {
          const listing = await getDocument('ceylonstays', editId);
          if (listing) {
            // Default to current date if no date or invalid date
            let availableDate;
            try {
              availableDate = listing.availableDate ? new Date(listing.availableDate).toISOString() : new Date().toISOString();
            } catch (error) {
              availableDate = new Date().toISOString();
            }

            setFormData({
              title: listing.title || '',
              description: listing.description || '',
              location: listing.location || '',
              bathrooms: listing.bathrooms || 1,
              bedrooms: listing.bedrooms || 1,
              pricePerNight: listing.pricePerNight || 0,
              pricePerMonth: listing.pricePerMonth || 0,
              pricingType: listing.pricingType || 'night',
              availableDate: availableDate
            });
            setExistingPhotos(listing.photos || []);
          }
        } catch (error) {
          console.error('Error loading listing:', error);
          setUploadError('Error loading listing data');
        }
      } else if (editId === 'new') {
        resetForm();
      }
    };

    loadListing();
  }, [editId, isAuthenticated]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === PASSCODE) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect passcode. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      bathrooms: 1,
      bedrooms: 1,
      pricePerNight: 0,
      pricePerMonth: 0,
      pricingType: 'night',
      availableDate: new Date().toISOString()
    });
    setSelectedFiles([]);
    setExistingPhotos([]);
    setUploadError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUploadError("");
    
    try {
      if (selectedFiles.length === 0 && existingPhotos.length === 0) {
        setUploadError("Please select at least one image to upload.");
        setIsLoading(false);
        return;
      }

      // Sign in anonymously before uploading
      await signInAnonymously(auth);

      // Upload new images if any
      let photoUrls = [...existingPhotos];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          try {
            const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const fileName = `${timestamp}-${randomString}.${fileExtension}`;
            const url = await uploadFile(file, `listings/${fileName}`);
            return url;
          } catch (error: any) {
            throw new Error(`Error uploading ${file.name}: ${error.message}`);
          }
        });

        const newPhotoUrls = await Promise.all(uploadPromises);
        photoUrls = [...photoUrls, ...newPhotoUrls];
      }

      // Prepare listing data
      const listingData = {
        ...formData,
        bathrooms: Number(formData.bathrooms),
        bedrooms: Number(formData.bedrooms),
        pricePerNight: formData.pricingType === 'night' ? Number(formData.pricePerNight) : 0,
        pricePerMonth: formData.pricingType === 'month' ? Number(formData.pricePerMonth) : 0,
        pricingType: formData.pricingType,
        photos: photoUrls,
        isListed: true,
        availableDate: formData.availableDate,
        createdAt: new Date().toISOString()
      };

      // Add new document or update existing one
      if (editId && editId !== 'new') {
        delete listingData.createdAt; // Don't update createdAt for existing listings
        await updateDocument("ceylonstays", editId, listingData);
      } else {
        await addDocument("ceylonstays", listingData);
      }

      // Reset form and refresh listings
      resetForm();
      setEditId(null);
      const updatedListings = await getDocuments('ceylonstays');
      setListings(updatedListings.map(doc => ({
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
        isListed: doc.isListed ?? true
      } as Listing)));
    } catch (error: any) {
      console.error("Error submitting listing:", error);
      setUploadError(error.message || "Error uploading listing. Please try again.");
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
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleListingToggle = async (listingId: string, currentStatus: boolean) => {
    try {
      await updateDocument("ceylonstays", listingId, { isListed: !currentStatus });
      // Refresh listings after toggle
      const updatedListings = await getDocuments('ceylonstays');
      setListings(updatedListings.map(doc => ({
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
        isListed: doc.isListed ?? true
      } as Listing)));
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-start justify-center pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">Enter Passcode</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please enter the passcode to manage listings
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handlePasscodeSubmit}>
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

  if (editId === 'new' || editId) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-8 ring-1 ring-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{editId === 'new' ? 'Add New' : 'Edit'} Listing</h1>
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
              {existingPhotos.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Existing Photos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {existingPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32">
                          <Image
                            src={photo}
                            alt={`Existing photo ${index + 1}`}
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 100vw, 300px"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">New Photos to Upload</p>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-500 truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Availability
              </label>
              <div className="flex gap-4 items-center">
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

                <div className="relative">
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
                    className="w-[240px] px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Manage Listings</h1>
            <button
              onClick={() => setEditId('new')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add New Listing
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{listing.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${listing.pricingType === 'night' ? listing.pricePerNight : listing.pricePerMonth}
                      <span className="text-xs text-gray-400 ml-1">
                        /{listing.pricingType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {listing.bedrooms}b {listing.bathrooms}ba
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleListingToggle(listing.id, listing.isListed)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          listing.isListed
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {listing.isListed ? 'Listed' : 'Delisted'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAvailableDate(listing.availableDate).replace('Available ', '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditId(listing.id)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 ml-auto"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 