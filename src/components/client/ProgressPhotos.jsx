import React, { useState, useEffect } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove } from 'firebase/database';
import { storage, db } from '../../firebase';
import { Camera, Trash2, Image as ImageIcon, ArrowLeftRight } from 'lucide-react';
import { formatDate, sortByDateDesc } from '../../utils/measurementUtils';

export default function ProgressPhotos({ userId }) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoType, setPhotoType] = useState('front');
  const [currentWeight, setCurrentWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    loadPhotos();
    loadLatestWeight();
  }, [userId]);

  const loadPhotos = async () => {
    try {
      const photosRef = dbRef(db, 'progress-photos');
      const snapshot = await get(photosRef);
      
      if (snapshot.exists()) {
        const allPhotos = snapshot.val();
        const photoData = Object.entries(allPhotos)
          .filter(([key, photo]) => photo.userId === userId)
          .map(([key, photo]) => ({ id: key, ...photo }));
        
        setPhotos(sortByDateDesc(photoData));
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const loadLatestWeight = async () => {
    try {
      const weightRef = dbRef(db, `weight-tracking/${userId}`);
      const snapshot = await get(weightRef);
      
      if (snapshot.exists()) {
        const allWeights = snapshot.val();
        const weightArray = Object.entries(allWeights)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (weightArray.length > 0) {
          setCurrentWeight(weightArray[0].weight.toString());
        }
      }
    } catch (error) {
      console.error('Error loading weight:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const fileRef = storageRef(storage, `progress-photos/${userId}/${fileName}`);
      
      await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(fileRef);

      const photosRef = dbRef(db, 'progress-photos');
      const newPhotoRef = push(photosRef);
      
      await set(newPhotoRef, {
        userId: userId,
        imageUrl: downloadURL,
        storagePath: `progress-photos/${userId}/${fileName}`,
        photoType: photoType,
        date: new Date().toISOString().split('T')[0],
        uploadedAt: new Date().toISOString(),
        weight: currentWeight ? parseFloat(currentWeight) : null,
        notes: notes
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setNotes('');
      loadPhotos();
      
      alert('✓ Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const fileRef = storageRef(storage, photo.storagePath);
      await deleteObject(fileRef);
      await remove(dbRef(db, `progress-photos/${photo.id}`));
      loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo.');
    }
  };

  const getFirstAndLatest = () => {
    if (photos.length < 2) return null;
    
    return {
      first: photos[photos.length - 1],
      latest: photos[0]
    };
  };

  const handlePhotoSelection = (photoId) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      }
      if (prev.length < 2) {
        return [...prev, photoId];
      }
      return [prev[1], photoId];
    });
  };

  const comparison = getFirstAndLatest();
  const photosByType = {
    front: photos.filter(p => p.photoType === 'front'),
    side: photos.filter(p => p.photoType === 'side'),
    back: photos.filter(p => p.photoType === 'back')
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Progress Photos</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visual evidence of your transformation
          </p>
        </div>
        <Camera className="w-8 h-8 text-emerald-500" />
      </div>

      {/* First vs Latest Comparison */}
      {comparison && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Your Transformation</h4>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2 text-sm"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {showComparison ? 'Hide' : 'View'} Comparison
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* First Photo */}
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                First Photo
              </div>
              <div className="relative group">
                <img 
                  src={comparison.first.imageUrl} 
                  alt="First" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg">
                  <div className="text-white text-sm font-medium">
                    {formatDate(comparison.first.date)}
                  </div>
                  {comparison.first.weight && (
                    <div className="text-white/80 text-xs">
                      Weight: {comparison.first.weight} lbs
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Latest Photo */}
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Latest Photo
              </div>
              <div className="relative group">
                <img 
                  src={comparison.latest.imageUrl} 
                  alt="Latest" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg">
                  <div className="text-white text-sm font-medium">
                    {formatDate(comparison.latest.date)}
                  </div>
                  {comparison.latest.weight && (
                    <div className="text-white/80 text-xs">
                      Weight: {comparison.latest.weight} lbs
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Weight Change */}
          {comparison.first.weight && comparison.latest.weight && (
            <div className="mt-4 text-center">
              <div className="inline-block bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-2">
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                  Weight Change: {Math.abs(comparison.latest.weight - comparison.first.weight).toFixed(1)} lbs
                  {comparison.latest.weight < comparison.first.weight ? ' lost ↓' : ' gained ↑'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Upload New Photo</h4>
        
        <div className="space-y-4">
          {/* Photo Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo Type
            </label>
            <div className="flex gap-2">
              {['front', 'side', 'back'].map(type => (
                <button
                  key={type}
                  onClick={() => setPhotoType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                    photoType === type
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
            {previewUrl ? (
              <div className="space-y-4">
                <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <div className="text-gray-600 dark:text-gray-400">
                  Click to select a {photoType} view photo
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Current Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Weight (Optional)
            </label>
            <input
              type="number"
              step="0.1"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              placeholder="Enter current weight"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this photo..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold disabled:opacity-50 hover:opacity-90 transition"
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          )}
        </div>
      </div>

      {/* Photo Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          📸 Photo Tips
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Take photos in the same lighting and location each time</li>
          <li>Use the same pose and clothing (or no shirt/form-fitting)</li>
          <li>Take photos in the morning for consistency</li>
          <li>Recommended: front, side, and back views for complete tracking</li>
        </ul>
      </div>

      {/* All Photos Gallery */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          All Photos ({photos.length})
        </h4>

        {photos.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">
              No photos uploaded yet. Upload your first photo above!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Photos by Type */}
            {['front', 'side', 'back'].map(type => {
              const typePhotos = photosByType[type];
              if (typePhotos.length === 0) return null;

              return (
                <div key={type}>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3 capitalize">
                    {type} View ({typePhotos.length})
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {typePhotos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img 
                          src={photo.imageUrl} 
                          alt={`${type} view`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        
                        {/* Overlay with info */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => handleDelete(photo)}
                            className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Info footer */}
                        <div className="mt-1">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {formatDate(photo.date)}
                          </div>
                          {photo.weight && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {photo.weight} lbs
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
