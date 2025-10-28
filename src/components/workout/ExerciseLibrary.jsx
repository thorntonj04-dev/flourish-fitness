import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Video } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove } from 'firebase/database';
import { db, storage } from '../../firebase';

export default function ExerciseLibrary({ onSelectExercise, selectedExercises = [] }) {
  const [exercises, setExercises] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    videoUrl: '',
    muscleGroup: 'chest'
  });
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const exercisesRef = dbRef(db, 'exercises');
      const snapshot = await get(exercisesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const exerciseList = Object.entries(data).map(([id, ex]) => ({ id, ...ex }));
        setExercises(exerciseList);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }

    setUploadingVideo(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, `exercise-videos/${fileName}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      setNewExercise({ ...newExercise, videoUrl: downloadURL });
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) {
      alert('Please enter an exercise name');
      return;
    }

    try {
      const exercisesRef = dbRef(db, 'exercises');
      const newExerciseRef = push(exercisesRef);
      await set(newExerciseRef, {
        ...newExercise,
        createdAt: new Date().toISOString()
      });
      
      setNewExercise({ name: '', description: '', videoUrl: '', muscleGroup: 'chest' });
      setShowAddForm(false);
      loadExercises();
    } catch (error) {
      console.error('Error adding exercise:', error);
      alert('Failed to add exercise');
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (!confirm('Delete this exercise? This will affect all workouts using it.')) return;
    
    try {
      await remove(dbRef(db, `exercises/${exerciseId}`));
      loadExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Failed to delete exercise');
    }
  };

  const muscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'mobility'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Exercise Library</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Exercise
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Exercise name"
            value={newExercise.name}
            onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            placeholder="Description / Instructions"
            value={newExercise.description}
            onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows="2"
          />
          <select
            value={newExercise.muscleGroup}
            onChange={(e) => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {muscleGroups.map(group => (
              <option key={group} value={group}>{group.charAt(0).toUpperCase() + group.slice(1)}</option>
            ))}
          </select>
          <div>
            <label className="block text-sm text-gray-600 mb-2">How-to Video (optional)</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="w-full text-sm"
              disabled={uploadingVideo}
            />
            {uploadingVideo && <p className="text-sm text-emerald-600 mt-1">Uploading...</p>}
            {newExercise.videoUrl && (
              <p className="text-sm text-green-600 mt-1">✓ Video uploaded</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddExercise}
              className="flex-1 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Save Exercise
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewExercise({ name: '', description: '', videoUrl: '', muscleGroup: 'chest' });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
        {exercises.map(exercise => {
          const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
          return (
            <div
              key={exercise.id}
              className={`p-3 border-2 rounded-lg transition cursor-pointer ${
                isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
              }`}
              onClick={() => onSelectExercise && onSelectExercise(exercise)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{exercise.name}</div>
                  <div className="text-xs text-gray-600 capitalize">{exercise.muscleGroup}</div>
                  {exercise.videoUrl && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                      <Video className="w-3 h-3" />
                      Has video
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteExercise(exercise.id);
                  }}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
