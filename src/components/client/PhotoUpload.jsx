import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Trash2, Camera, Shield, BarChart3, Target, Menu, X, ChevronRight, Award, Heart, TrendingUp, Play, Pause, Check, Plus, Minus, Video, Calendar, Clock, Trophy, Save, Edit2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove, update, query as dbQuery, orderByChild, equalTo, onValue } from 'firebase/database';
import { auth, db, storage } from '../../firebase';
import Tesseract from 'tesseract.js';

export default function PhotoUpload({ user }) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, [user]);

  const loadPhotos = async () => {
    try {
      const photosRef = dbRef(db, 'progress-photos');
      const snapshot = await get(photosRef);
      
      if (snapshot.exists()) {
        const allPhotos = snapshot.val();
        const photoData = Object.entries(allPhotos)
          .filter(([key, photo]) => photo.userId === user.uid)
          .map(([key, photo]) => ({ id: key, ...photo }))
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setPhotos(photoData);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
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
      const fileRef = storageRef(storage, `progress-photos/${user.uid}/${fileName}`);
      
      await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(fileRef);

      const photosRef = dbRef(db, 'progress-photos');
      const newPhotoRef = push(photosRef);
      await set(newPhotoRef, {
        userId: user.uid,
        userName: user.displayName || user.email,
        imageUrl: downloadURL,
        storagePath: `progress-photos/${user.uid}/${fileName}`,
        uploadedAt: new Date().toISOString(),
        weekNumber: photos.length + 1
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      loadPhotos();
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

  const getWeekComparison = () => {
    if (photos.length < 2) return null;
    return {
      first: photos[photos.length - 1],
      latest: photos[0]
    };
  };

  const comparison = getWeekComparison();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Progress Photos</h2>
        <p className="text-emerald-100">Track your transformation week by week</p>
      </div>

      {comparison && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Week 1</div>
              <img 
                src={comparison.first.imageUrl} 
                alt="Week 1" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-2">
                {new Date(comparison.first.uploadedAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">
                Week {comparison.latest.weekNumber} (Latest)
              </div>
              <img 
                src={comparison.latest.imageUrl} 
                alt="Latest" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-2">
                {new Date(comparison.latest.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upload New Photo</h3>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
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
                <div className="text-gray-600">Click to select a photo</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition"
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Your Photos ({photos.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img 
                src={photo.imageUrl} 
                alt={`Week ${photo.weekNumber}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition rounded-lg flex items-center justify-center">
                <button
                  onClick={() => handleDelete(photo)}
                  className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Week {photo.weekNumber}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(photo.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

